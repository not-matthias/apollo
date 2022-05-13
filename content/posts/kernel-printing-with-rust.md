---
title: "Kernel printing with Rust."
date: "2020-08-21"
---

## Preface

Printing is important. If something doesn't work, you want to know **why** (e.g. by looking at the console output). When I first wrote the [log macro](https://github.com/not-matthias/kernel-driver-with-rust/blob/master/src/log.rs) for my kernel driver I didn't think much about the security. I just thought: "Surely nobody will call it with the wrong format specifiers or the wrong number of arguments, because the usage is simple and straightforward". 

As you probably can guess, this is against all the principles of Rust. If you use `unsafe` you need to ensure that the implementation is safe. This way you can be sure that the driver will be fine when there are no compiler warnings. 

So let's make it a little safer. 

## Determining the problem

I already gave it away. The problem is the variadic function [DbgPrint](https://docs.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-dbgprint) which does not verify whether you called it with the correct parameters. So there's no link between the arguments and format specifiers. Thus it would be possible to do something like this with our current implementation: 

```rust
log!("[%i] %s (%p)", "0", 0);
```

In the best case we just crash, but this can also be exploited and be a critical security vulnerability. In fact, this is exactly what [Format String Attacks](https://ctf-wiki.github.io/ctf-wiki/pwn/linux/fmtstr/fmtstr_intro/#format-string-vulnerability-principle) do. If you are interested in this topic, I recommend checking out the article [Exploiting Format String Vulnerabilities](https://cs155.stanford.edu/papers/formatstring-1.2.pdf) from 2001. 

## Solution 1

Hmm, so can't you just compare the format specifier count with the number of arguments? Well yes, but actually no. In order to better understand the reason behind this, here's the macro from the last post. 

```rust
macro_rules! log {
    ($string: expr, $($x:tt)*) => {
        unsafe {
            $crate::DbgPrint(concat!("[>] ", $string, "\0").as_ptr(), $($x)*)
        }
    };
}
```

We could theoretically check the number of the format specifiers using something like `.matches("%").count()`, but this is already flawed. We also need to check whether the format specifier even exists, as you can pass a percent sign whenever you want. As you can see, this gets complicated fast. 

Another problem is the counting of the parameters as we are just accepting any [TokenTree](https://doc.rust-lang.org/reference/macros-by-example.html#metavariables) elements and pass it to `DbgPrint`. 
We could just update the repetition to `$($x:expr $(,)?)*` but then we also need to somehow get the count. This requires some tricks, but luckily other people already [thought about this](https://danielkeep.github.io/tlborm/book/blk-counting.html). 

To summarize: We would need to check for every possible use case which is really complex and error-prone. These checks also only happen at runtime so we need to think about how we would want to handle those errors. Do we panic? Do we just do nothing? Do we print an error message? This slows down development and testing drastically as there's no instant feedback from the compiler anymore. 

Maybe there's an easier way to do this. 

## Solution 2

When I posted the article [Writing a kernel driver with Rust](https://not-matthias.github.io/kernel-driver-with-rust/) on Reddit, [/u/daniel5151](https://www.reddit.com/u/daniel5151/) pointed out that the log macro can be pretty dangerous. 

<a class="embedly-card" href="https://www.reddit.com/r/rust/comments/hrwyl8/writing_a_kernel_driver_with_rust/fy7fnyw">Card</a>
<script async src="//embed.redditmedia.com/widgets/platform.js" charset="UTF-8"></script>

When I first looked at the source code of the mentioned library, I didn't realize that it was using the [format_args](https://doc.rust-lang.org/std/macro.format_args.html) macro. A short time later, [czapek](https://github.com/czapek1337) mentioned that I could use `format_args` which would allow me to replicate the printing macros of the standard library. 

After taking a closer look at the Github repository, I noticed that it was also using `format_args` so I decided to create a library for kernel drivers. Let's explore how this works. 

If you would have access to the standard library, you could use [ToString](https://doc.rust-lang.org/std/string/trait.ToString.html) to convert the return value of the `format_args` macro. However, as the `String` type is not available in the core library, we cannot use that. A workaround for this would be the `alloc` crate, but I didn't like this approach as it requires a custom allocator and heap allocations. You might now wonder: Is it possible to convert it to `&str`? Well, I'm glad you asked. Recently a new feature called [fmt_as_str](https://doc.rust-lang.org/nightly/unstable-book/library-features/fmt-as-str.html) has been added, but as of the release date of this post, it's still fairly limited. Currently, you can only get the formatted string if it has no arguments. So if we also wanted to use arguments, we would have to use a hybrid approach: 

```rust
#![feature(fmt_as_str)]

use core::fmt::Arguments;

fn write_str(_: &str) {
    /* ... */
}

fn write_fmt(args: &Arguments) {
    if let Some(s) = args.as_str() {
        write_str(s)
    } else {
        write_str(&args.to_string());
    }
}
```

If you look closely, you can see the `to_string` call, so we are back to zero. So is there any way that we can the formatted string slice? Let's look at the documentation of [format_args!](https://doc.rust-lang.org/core/macro.format_args.html) again. Maybe we missed something. 

> This macro produces a value of type [fmt::Arguments](https://doc.rust-lang.org/std/fmt/struct.Arguments.html). This value can be passed to the macros within [std::fmt](https://doc.rust-lang.org/std/fmt/index.html) for performing useful redirection. All other formatting macros ([format!](https://doc.rust-lang.org/std/macro.format.html), [write!](https://doc.rust-lang.org/std/macro.write.html), [println!](https://doc.rust-lang.org/std/macro.println.html), etc) are proxied through this one. `format_args!`, unlike its derived macros, avoids heap allocations.

Hmmm, so all these links are referencing the standard library. The reason behind this is probably to have all the documentation in one place as it is just [reexporting](https://github.com/rust-lang/rust/blob/master/library/std/src/lib.rs#L379) it from the `alloc` crate (which actually [reexports](https://github.com/rust-lang/rust/blob/master/library/alloc/src/fmt.rs#L532-L551) it from the `core` crate). 

The only macro that exists in the core crate is [write!](https://doc.rust-lang.org/core/macro.write.html). After reading the documentation, you'll quickly realize that it's quite similar to the `format_args!` macro. Instead of return `fmt::Arguments` it writes it to a buffer. There's one example that caught my eye. 

```rust
use core::fmt::Write;

struct Example;

impl Write for Example {
    fn write_str(&mut self, _s: &str) -> core::fmt::Result {
         unimplemented!();
    }
}

let mut m = Example{};
write!(&mut m, "Hello World").expect("Not written");
```

It seems like we can use the `Write` trait to specify where we want to write to. In this example, we'll probably get the formatted string slice as a parameter for the `write_str` trait function. As I'm not 100% sure about that, I'm using the option to run the code sample on the [Rust Playground](https://play.rust-lang.org/?code=%23!%5Ballow(unused)%5D%0Aextern%20crate%20core%3B%0Afn%20main()%20%7B%0Ause%20core%3A%3Afmt%3A%3AWrite%3B%0A%0Astruct%20Example%3B%0A%0Aimpl%20Write%20for%20Example%20%7B%0A%20%20%20%20fn%20write_str(%26mut%20self%2C%20_s%3A%20%26str)%20-%3E%20core%3A%3Afmt%3A%3AResult%20%7B%0A%20%20%20%20%20%20%20%20%20unimplemented!()%3B%0A%20%20%20%20%7D%0A%7D%0A%0Alet%20mut%20m%20%3D%20Example%7B%7D%3B%0Awrite!(%26mut%20m%2C%20%22Hello%20World%22).expect(%22Not%20written%22)%3B%0A%7D&edition=2018) by clicking on the `Run` button in the top right corner. When I adjust the source code to actually pass a parameter and print it, it works as expected. 

```rust
#![allow(unused)]
extern crate core;
fn main() {
    use core::fmt::Write;
    
    struct Example;
    
    impl Write for Example {
        fn write_str(&mut self, _s: &str) -> core::fmt::Result {
             println!("{}", _s);
             Ok(())
        }
    }
    
    let mut m = Example{};
    write!(&mut m, "Hello World: {}", 42).expect("Not written");
}
```

But having to call `write!` whenever we want to log something to the console is pretty complicated. I'm sure there's a better way to do this. We can again look at the source code and try to understand how it works. Luckily it's just a simple wrapper that calls the `write_fmt` function with the return value of the `format_args!` macro. 

```rust
#[macro_export]
#[stable(feature = "rust1", since = "1.0.0")]
macro_rules! write {
    ($dst:expr, $($arg:tt)*) => ($dst.write_fmt($crate::format_args!($($arg)*)))
}
```

Finally! That's exactly what I was looking for. A way to use the result of `format_args` (which has the type `fmt::Arguments`). In this case, we just have to implement the `Writer` trait and create our own `write_str` function which then prints the formatted string. That's actually easier than I thought it would be. 

So let's start by creating our structure and implement `Write`. 

```rust
pub struct KernelWriter;

impl core::fmt::Write for KernelWriter {
    fn write_str(&mut self, s: &str) -> core::fmt::Result {
        __kernel_println(s)
    }
}

pub fn __kernel_println(msg: &str) -> core::fmt::Result {
    unsafe { ntapi::ntdbg::DbgPrint(msg.as_ptr() as _) };
    Ok(())
}
```

If you read the [previous article](https://not-matthias.github.io/kernel-driver-with-rust/), you'll notice that I'm not using the [winapi](https://github.com/Trantect/winapi-rs) crate. After I published the article I remembered that the [ntapi](https://github.com/MSxDOS/ntapi) crate exists. There's also a `kernel` feature which can be used in our driver. We can add the following to our `Crates.toml` and then we are good to go: 

```toml
[dependencies]
ntapi = { version = "0.3.4", default-features = false, features = ["kernel"] }
```

Okay, but having to instantiate the `KernelWriter` structure and calling the methods whenever we want to print things is a lot of effort and kind of complicated. We can replicate macros like `println!` and `dbg!` but we should also create some helper methods that make using it easier. 

```rust
impl KernelWriter {
    pub const fn new() -> Self {
        Self
    }

    pub fn write_fmt(&mut self, args: core::fmt::Arguments) -> core::fmt::Result {
        core::fmt::Write::write_fmt(self, args)
    }

    pub fn write_str(&mut self, s: &str) -> core::fmt::Result {
        core::fmt::Write::write_str(self, s)
    }

    pub fn write_nl(&mut self) -> core::fmt::Result {
        __kernel_println("\n")
    }
}
```

The constructor and `write_nl` should be self-explanatory. When you see `write_fmt` and `write_str` you might wonder why those exist. Well, if you wanted to use the kernel writer and call the functions defined in the `Write` trait (like `write_fmt` or `write_fmt`), you would have to import the trait or call it directly.

Importing the trait inside a macro won't work as it's possibly redefining it. The following code will fail with the error `error[E0252]: the name Write is defined multiple times`.

```rust
macro_rules! kernel_println {
    ($($arg:tt)*) => {
        use core::fmt::Write;

        let mut writer = KernelWriter::new();
        writer.write_fmt(format_args!($($arg)*));
        writer.write_nl();
    };
}

fn test_println() {
    kernel_println!("Hello World");
    kernel_println!("Hello World");
}
```

We could wrap the entire macro inside `{}` so we can import it for different scopes. I didn't like that approach, that's why I decided to just call the function directly. We could also just do that in the macro, but moving it to the structure reduces the amount of code we have to write. 

Okay, so we finished the writer implementation, now we can finally implement our macros. They are pretty straightforward. We can just create a new `KernelWriter` instance, call `format_args` and pass it to `write_fmt`.

```rust
macro_rules! kernel_println {
    () => { $crate::kernel_println!("") };
    ($($arg:tt)*) => {
        {
            let mut writer = $crate::writer::KernelWriter::new();
            let _ = writer.write_fmt(format_args!($($arg)*));
            let _ = writer.write_nl();
        }
    };
}
```

Everything that has been mentioned until here has already been implemented in the [rust-libc-print](https://github.com/mmastrac/rust-libc-print/) project. When I was looking through the issues, I noticed that someone was asking about the `dbg!` macro as it hasn't been implemented yet. I wasn't sure if that's even possible, so I decided to take a look at the macro definition. 

It turns out that it only uses the `println!` macro combined with `file!`, `line!` and `stringify!`. We can just copy the code, update the `println!` macro to use our custom macro and we are done. Pretty easy, right?

```rust
#[macro_export]
macro_rules! kernel_dbg {
    () => {
        $crate::println!("[{}:{}]", file!(), line!());
    };
    ($val:expr) => {
        // Use of `match` here is intentional because it affects the lifetimes
        // of temporaries - https://stackoverflow.com/a/48732525/1063961
        match $val {
            tmp => {
                $crate::println!("[{}:{}] {} = {:#?}",
                    file!(), line!(), stringify!($val), &tmp);
                tmp
            }
        }
    };
    // Trailing comma with single argument is ignored
    ($val:expr,) => { $crate::dbg!($val) };
    ($($val:expr),+ $(,)?) => {
        ($($crate::dbg!($val)),+,)
    };
}
```

Alright, let's use the logging crate in the existing [driver project](https://github.com/not-matthias/kernel-driver-with-rust) and add the following. 

```rust
#[no_mangle]
pub extern "system" fn driver_entry() -> u32 {
    kernel_print::kernel_dbg!(2 + 2);
    kernel_print::kernel_print!("{} + {} = {}\n", 2, 2, 2 + 2);
    kernel_print::kernel_println!("{} + {} = {}", 2, 2, 2 + 2);

    0 /* STATUS_SUCCESS */
}
```

Wait, if you try to run it, it doesn't work? That's weird. Why does it work when using [rust-libc-print](https://github.com/mmastrac/rust-libc-print) but not for our implementation? 

```
[:]  = src/lib.rs:]  = 56]  = 2 + 2 = 0„û…Šÿÿ4 
 + 2 + 2 = 4 
 + 2 + 2 = 4 
```

After some time and looking at the output, I recognized patterns. Between the strings, there are non-printable bytes and at the end, there's `û…Šÿÿ4`. Wait a minute, does the writer not know where our strings end? That's it. The strings in rust are not null-terminated (`\0`) so when we pass the string as a pointer to `DbgPrint` there's no way it can know where it ends. 

Alright, we know what's wrong but how can we fix it? Well, it's not that simple. Currently, we know the exact size of the string that needs to be printed so it can be allocated on the stack. If we wanted to add additional characters, there's no way to guarantee that we have enough space on the stack. 

To get around this, we have to use a custom allocator. I really tried to avoid it, but it seems like it's the only way. I decided to create a [crate](https://crates.io/crates/kernel-alloc) so that other people can also use it. 

The implementation is simple and straightforward. We just need to implement the `GlobalAlloc` trait. You also need to implement the definitions and an allocation error handler, which have been left out for the sake of simplicity. 

```rust
pub struct KernelAlloc;

unsafe impl GlobalAlloc for KernelAlloc {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        let pool = ExAllocatePool(PoolType::NonPagedPool, layout.size());

        if pool.is_null() {
            panic!("[kernel-alloc] failed to allocate pool.");
        }

        pool as _
    }

    unsafe fn dealloc(&self, ptr: *mut u8, _layout: Layout) { ExFreePool(ptr as _); }
}
```

If you want to use the allocator in your project, you have to define a global allocator. If you are developing a library, you don't need to do that. You can just specify that you need to use the `alloc` crate and if someone tries to use this library without an allocator, an error will be shown. If you want to use the library, you have to add the following code: 

```rust
#[global_allocator]
static GLOBAL: KernelAlloc = KernelAlloc;
```

Now that we can allocate memory on the heap, we have to think about the best way to utilize this. Because the strings passed to the `DbgPrint` function are the primary problem, we can just append the null terminator. 

```rust
unsafe { ntapi::ntdbg::DbgPrint(alloc::format!("{}\0", msg).as_ptr() as _) };
```

Let's try to run our example driver again. Awesome, it works!

```
[src/lib.rs:58] 2 + 2 = 4 
2 + 2 = 4 
2 + 2 = 4
```

## Solution 3

The previous implementation is pretty complicated and can be simplified now that we are using an allocator anyway. Instead of using `format_args!` and then passing the result to `core::fmt::Write`, we can just directly call `format!`. This would then look something like this: 

```rust
let string = alloc::format!($($arg)*);
__kernel_println(string);
```

I decided to update the `__kernel_println` function so that we can pass both `&str` and `String` but still append the null-terminator. This way we can easily pass the output of `format!` without having to update the already written code. Using `Into<String>` also reduces the number of allocations because only string slices (`&str`) need to be converted. 

```rust
pub fn __kernel_println<S: Into<String>>(string: S) -> core::fmt::Result {
    // Add the null-terminator to the string.
    //
    let string = {
        let mut temp = string.into();
        temp.push('\0');
        temp
    };

    // Print the null-terminated string.
    //
    unsafe { ntapi::ntdbg::DbgPrint(string.as_ptr() as _) };

    Ok(())
}
```

## Conclusion

This post basically only exists because <strike>I was lazy</strike> I thought that it's just a proof of concept, that the usage is clear and that I can worry about the safety later. Even though I was only playing around, I should have implemented it properly in the first place to spare me the trouble later on. I hope you learned something from my mistakes. 
An example utilizing the [kernel-print](https://crates.io/crates/kernel-print) crate can be found in the [kernel-driver-with-rust](https://github.com/not-matthias/kernel-driver-with-rust/blob/master/src/lib.rs#L49-L51) repository.



Shoutout to [/u/daniel5151](https://www.reddit.com/u/daniel5151/) and [czapek](https://github.com/czapek1337) for recognizing the problem and providing helpful information, resources and examples. 

Thanks for reading!