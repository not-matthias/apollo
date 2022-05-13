---
title: "Custom Allocators in Rust"
date: "2022-01-18"
---

## Preface

I'm currently writing an AMD hypervisor in Rust and there I need to allocate memory for lots of different structures. And not all of them use the same memory, so I decided to create a helper structure to allocate and deallocate it for me.

## My Implementation

My implementation has 2 different types: 
- `Normal`: non-paged pool memory allocated with `ExAllocatePoolWithTag`
- `Contiguous`: physical memory allocated with `MmAllocateContiguousMemorySpecifyCacheNode`

The first implementation looked like this:

```rust
pub enum AllocType {
    Normal,
    Contiguous,
}

pub struct AllocatedMemory<T>(NonNull<T>, AllocType);

impl<T> AllocatedMemory<T> {
     pub fn alloc_normal() -> Option<Self> { /* allocate memory */ }
     pub fn alloc_contiguous() -> Option<Self> { /* allocate memory */ }
}

// Deref/DerefMut implementations skipped

impl<T> Drop for AllocatedMemory<T> {
    fn drop(&mut self) {
        match self.1 {
            AllocType::Normal => { /* Free memory using ExFreePool */ }
            AllocType::Contiguous => { /* Free memory using MmFreeContiguousMemory */ }
        }
    }
}
```

Doesn't look too complicated, huh? That's exactly what I thought, but there is one big problem with this. Can you spot it?

Let's look at the following example code:

```rust
{
    // Bar { ... }
    // Foo { bar: AllocatedMemory<Bar> }
    let foo = {
        let foo = AllocatedMemory::<Foo>::alloc_normal();
        foo.bar = AllocatedMemory::<Bar>::alloc_contiguous();
        foo
    };
}
```

Now, what do you think happens at the end of the scope? 
1. Both allocations will be dropped and deallocated
2. Only `bar` will be dropped and deallocated
3. Only `foo` will be dropped and deallocated
4. Nothing will be deallocated

You might have guessed it. Answer 3 is correct. What happens to `bar`? It's simple: Because we aren't capturing `T` inside `AllocatedMemory`, the compiler thinks it can drop the allocation immediately. For some reason, the compiler even optimized the pointer to `0x0`, so if you run the code, the driver would crash due to an access violation (
`0xffffffffc0000005`) because we are passing a null pointer to `ExFreePool`/`MmFreeContiguousMemory`. We can't just add a check for it, because then we would be leaking memory.

Here's what I think is happening:

```rust
{
    let foo = {
        let foo = AllocatedMemory::alloc_normal();
        foo.bar = AllocatedMemory::alloc_contiguous();
        foo
    }; // End of scope: Bar is only used inside it, so it's dropped. 
       //               Value is assigned to `bar`.
} // End of scope: Foo is dropped.
```

In the disassembly, it looked like this. You can see the allocation with `MmAllocateContiguousMemorySpecifyCacheNode` and then in the last lines it immediately tries to deallocate it. 

![disassembly](https://user-images.githubusercontent.com/26800596/150001862-8783b129-5c5c-40f4-84a9-f21c64c8e0d5.png)


---

This bug was driving me insane because I didn't know what was causing it. I tried so many different things that didn't work: 
- Disabled all unneeded features
- Disabled LTO (link-time-optimization)
- Tried a ton of different compilation
- Remove AllocType, to check if it was a compiler bug/optimization
- Replaced `NonNull<T>` with `*mut T`

After none of my fixes worked, I decided to consult the [Rust Nomicon](https://doc.rust-lang.org/nomicon/ffi.html). Unfortunately, that didn't solve my problems either. I learned about tricky scenarios and common mistakes again, but none of them helped me figure out a solution.

## Looking at existing implementations

I already knew about `Box<T>` and `Vec<T>`, so I wondered how they are implemented behind the scenes because they work similarly.

### `Vec<T>`

`Vec<T>` is backed by [`RawVec`](https://github.com/rust-lang/rust/blob/master/library/alloc/src/raw_vec.rs#L52-L56) which uses [`Unique<T>`](https://github.com/rust-lang/rust/blob/master/library/core/src/ptr/unique.rs) for the data pointer. `Unique<T>` is a wrapper around `NonNull<T>`, but it behaves as if it was an instance of `T`. That's exactly what we want. 

```rust
pub struct Vec<T, A: Allocator = Global> {
    buf: RawVec<T, A>,
    len: usize,
}

pub(crate) struct RawVec<T, A: Allocator = Global> {
    ptr: Unique<T>,
    cap: usize,
    alloc: A,
}

#[repr(transparent)]
pub struct Unique<T: ?Sized> {
    pointer: *const T,

    // NOTE: this marker has no consequences for variance, but is necessary
    // for dropck to understand that we logically own a `T`.
    //
    // For details, see:
    // https://github.com/rust-lang/rfcs/blob/master/text/0769-sound-generic-drop.md#phantom-data
    _marker: PhantomData<T>,
}
```

The `Drop` implementation also uses `#[may_dangle]` to assert that the destructor of a generic type is guaranteed to not access any expired data. You can read more about that in the [Rust Nomicon - An Escape Hatch](https://doc.rust-lang.org/nomicon/dropck.html).

```rust
unsafe impl<#[may_dangle] T, A: Allocator> Drop for RawVec<T, A> {
    fn drop(&mut self) { /* skipped */ }
}
```

I tried both implementing `Unique<T>` and `#[may_dangle]`, but that didn't solve my problem.

### `Box<T>`

This one is much simpler because it's just a `Unique<T>` pointer (so it asserts that `Box` owns the data). 
```rust
pub struct Box<T: ?Sized, A: Allocator = Global>(Unique<T>, A);
```

There are many different allocator implementations, but I was only interested in one thing: the `Drop` implementation. I thought: "Maybe they do some black magic, to make sure that the inner elements are dropped correctly". And yes, they do, because there's **literally nothing**.

```rust
unsafe impl<#[may_dangle] T: ?Sized, A: Allocator> const Drop for Box<T, A> {
    fn drop(&mut self) {
        // FIXME: Do nothing, drop is currently performed by compiler.
    }
}
```

---

Since none of my previous attempts worked, I tried to replace `AllocatedMemory<T>` with `Box<T>`, but it still didn't work. I tried a few different examples and figured out the problem. 

Here's the what the structures look like: 
```rust
struct Bar {
    value: u32,
}
struct Foo {
    bar: Box<Bar>,
}
```

For example, this code works:
```rust
{
    let mut bar = unsafe { Box::<Bar>::new_zeroed().assume_init() };
    bar.value = 42;
    let mut foo = Box::new(Foo { bar });
}
```

Yet these two examples don't work: 
```rust
{
    let mut foo: Box<Foo> = unsafe { Box::<Foo>::new_zeroed().assume_init() };
    foo.bar = Box::new(Bar { value: 42 });
}
```
```rust
{
    let mut bar = unsafe { Box::<Bar>::new_zeroed().assume_init() };
    bar.value = 42;

    let mut foo: Box<Foo> = unsafe { Box::<Foo>::new_zeroed().assume_init() };
    foo.bar = bar;
}
```

`Box::new_zeroed()` refers to the `MaybeUninit::zeroed()` documentation, which mentions the following:

> Note that dropping a MaybeUninit<T> will never call T's drop code. It is your responsibility to make sure T gets dropped if it got initialized.

So it is actually not the Rust compiler that's wrong, it's me. I'm still not sure why my `AllocatedMemory` implementations were not working, but I now know that lots of effort has been put into making `Box<T>` sound and safe.

## Final solution

While going through the [source code of `Box<T>`](https://github.com/rust-lang/rust/blob/master/library/alloc/src/boxed.rs) I also noticed the new [allocator api](https://doc.rust-lang.org/beta/unstable-book/library-features/allocator-api.html). Because I needed to redesign the `AllocatedMemory` structure, I decided to use `Box` with custom allocators instead.

I already have a [global allocator](https://github.com/not-matthias/kernel-alloc-rs) which allocates pool memory, so I only need to write one for physical memory. We only have to implement the `Allocator` trait, and we are good to go:

```rust
pub struct PhysicalAllocator;

unsafe impl Allocator for PhysicalAllocator {
    fn allocate(&self, layout: Layout) -> Result<NonNull<[u8]>, AllocError> {
        /* allocate physical memory and return it */
    }

    unsafe fn deallocate(&self, ptr: NonNull<u8>, layout: Layout) {
        /* deallocate physical memory */
    }
}
```

Now we can either pass `alloc::Global` or `PhysicalAllocator` to the functions like this: 
```rust
let foo: Box<u64, PhysicalAllocator> = Box::new_in(42, PhysicalAllocator);
```

Instead of passing `alloc::Global` (the global allocator) to `Box::new_in`, we can also just use the default implementation `Box::new`.
```rust
#[global_allocator]
static GLOBAL: KernelAlloc = KernelAlloc;

let foo: Box<u64> = Box::new_in(42, alloc::Global);
let foo: Box<u64> = Box::new(42);
```

There's even fallible allocations if you want to handle the allocation errors yourself. `Box::new_in` is just a wrapper around `Box::try_new_in` and calls `handle_alloc_error(layout)` upon failure.
```rust
let foo: Box<u64, PhysicalAllocator> = match Box::try_new_in(42, PhysicalAllocator) {
    Ok(foo) => foo,
    Err(e) => /* handle alloc error */
};
```

So now, instead of using `AllocatedMemory<T>`, we can use `Box<T>` and get rid of all the bugs and crashes. 

## Conclusion

I actually really like this change. We can reuse existing implementations and allocate it **wherever we want**. We also reduced the amount of code we have to manage and other people can understand the code more easily.

I also think I'd have a hard time trying to implement `Drop` myself when `Box` is using the compiler for that. There's probably a good reason for that. If you know why, please let me know.

---

Thanks for reading.

