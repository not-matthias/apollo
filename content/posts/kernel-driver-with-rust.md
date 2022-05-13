---
title: "Writing a kernel driver with Rust."
date: "2020-07-15"
---

# Preface

I read the official [Rust book](https://doc.rust-lang.org/book/) already in the end of 2019 but never had a project idea. That's why I decided to rewrite one of my already existing C++ projects. A few months after I started I already gained lots of experience and began to wonder whether it's possible to rewrite my Windows Kernel Drivers in Rust. A quick search lead me to many unanswered questions and two Github repositories. One of these repositories is [winapi-kmd-rs](https://github.com/pravic/winapi-kmd-rs) which is unfortunately really complicated and outdated. I almost gave up until I stumbled upon [win_driver_example](https://github.com/Trantect/win_driver_example) which made me realize that a lot has changed and that it's not even that hard. This post summarize what went wrong and what I learned. 

# Project Setup

I'll keep this example project simple but I recommend creating a [workspace](https://doc.rust-lang.org/book/ch14-03-cargo-workspaces.html) so you don't end up having one big project. I made this mistake and had to break it into multiple crates. I sat down and thought of a folder structure and split the project into 21 different crates. This might sound a bit overkill, but I really like having a crate for only one task. For example, I have `log`, `string`, `nt` and `km-alloc` crates which makes refactoring a lot easier and allows you to reuse those crates in other projects. 

With that in mind, let's get started with a demo project. The first thing we need to do is setup our driver project with the command `cargo new --bin driver` and open it in the editor of your choice. 

Rust provides lots of abstractions in the [standard library](https://doc.rust-lang.org/std/) which cannot be used in the kernel because it uses the Windows API behind the scenes. Thanks to the awesome language design, we can remove the standard library by specifying the `#![no_std]` attribute in `main.rs`. 

```rust
#![no_std]

fn main() {}
```

However, if you try to build the project, you'll get some errors: 

```
D:\driver>cargo b
   Compiling driver v0.1.0 (D:\driver)

error: `#[panic_handler]` function required, but not found
error: language item required, but not found: `eh_personality`
error: aborting due to 2 previous errors
error: could not compile `driver`.
```

It turns out, the standard library actually does all these things behind the scenes. So let's implement it ourself. The second error can be fixed quite easily by modifying the build profile. An explanation for this error can be found [here](https://stackoverflow.com/a/48984171).

```toml
[profile.dev]
panic = "abort"
```

Now lets fix the first error. Just looking at the attribute name says a lot. When our program [panics](https://doc.rust-lang.org/std/macro.panic.html), an unrecoverable error occurs. Rust will unwind the stack, clean up the resources and show a nice error message. But in the kernel, there's no console and thus we have to handle these unrecoverable errors ourself. 

```rust
#![no_std]

use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}

fn main() {}
```

You can try to build the project again but it won't work yet, because I didn't tell you everything. We are not compiling a binary, but actually a library. A dynamic link library (`.dll`) to be more precise. Rename your `main.rs` to `lib.rs` and add the following to your  `Cargo.toml`:

```toml
[lib]
path = "src/lib.rs"
crate-type = ["cdylib"]
```

When we try to build the project again we get a different error: `LINK : error LNK2001: unresolved external symbol _DllMainCRTStartup`. When Rust calls the Visual Studio linker behind the scenes, it passes the parameters that would normally be used to compile a dll. Luckily, we can override those and define our custom entry point. For that, we need to create a file `.cargo/config` in our project. 

```toml
[build]
target = "x86_64-pc-windows-msvc"

rustflags = [
    # Pre Link Args
    "-Z", "pre-link-arg=/NOLOGO",
    "-Z", "pre-link-arg=/NXCOMPAT",
    "-Z", "pre-link-arg=/NODEFAULTLIB",
    "-Z", "pre-link-arg=/SUBSYSTEM:NATIVE",
    "-Z", "pre-link-arg=/DRIVER",
    "-Z", "pre-link-arg=/DYNAMICBASE",
    "-Z", "pre-link-arg=/MANIFEST:NO",

    # Post Link Args
    "-C", "link-arg=/OPT:REF,ICF",
    "-C", "link-arg=/ENTRY:driver_entry",
    "-C", "link-arg=/MERGE:.edata=.rdata",
    "-C", "link-arg=/MERGE:.rustc=.data",
    "-C", "link-arg=/INTEGRITYCHECK"
]
```
These options should be relatively self-explanatory. The most important one is the `/ENTRY` option, where we can set our custom program entry point. If you don't understand some of these, you can look them up in the [official documentation](https://docs.microsoft.com/en-us/cpp/build/reference/linker-options). The [entry point](https://docs.microsoft.com/en-us/windows-hardware/drivers/wdf/driverentry-for-kmdf-drivers) would normally have also two parameters but I decided to leave them for the sake of simplicity. 

```rust
#[no_mangle]
pub extern "system" fn driver_entry() -> u32 {
    0 /* STATUS_SUCCESS */
}
```

If we try to build our project again, it finally works! You can find the output file in the `driver\target\x86_64-pc-windows-msvc\debug` folder. Remember when I told you that we actually create a library? Well, unfortunately Rust has no option to rename the file extension to `.sys`. More information on how this restriction can be circumvented can be found below.

If that's a big deal for you, you can take a look at [cargo-xbuild](https://github.com/rust-osdev/cargo-xbuild). I also started my project with it but eventually migrated away from it, because a change in `cargo` caused an [assertion to fail](https://github.com/rust-lang/cargo/issues/8308). The usage is pretty straightforward and can also be found in the [win_driver_example](https://github.com/Trantect/win_driver_example) repository. 

# Linker Settings

If you try to define and call kernel functions with our current project, it won't work because the linker can't find the libraries that define those functions. In order to get that to work, we need to extend the linker search path. Of course we could just hardcode the path in our application, but that's not really idiomatic. It turns out that [Trantect](https://github.com/Trantect) did that already in one of their projects. If you take a look at the [build script](https://github.com/Trantect/win-kmd-alloc/blob/master/build.rs), you'll see that it searches the Registry to find the path to the kernel libraries (in my case `C:\Program Files (x86)\Windows Kits\10\lib\10.0.18362.0\km`). Here's the code that is responsible for finding and setting the path.  

```rust
let windows_kits_dir = get_windows_kits_dir().unwrap();
let km_dir = get_km_dir(&windows_kits_dir).unwrap();
let target = var("TARGET").unwrap();

let arch = if target.contains("x86_64") {
    "x64"
} else if target.contains("i686") {
    "x86"
} else {
    panic!("Only support x86_64 and i686!");
};

let lib_dir = km_dir.join(arch);
println!(
    "cargo:rustc-link-search=native={}",
    lib_dir.to_str().unwrap()
);
```

# Interacting with the kernel

Alright, we can run our Rust driver in the kernel, but that's basically useless since Rust doesn't have bindings to the kernel library. Luckily, Rust makes it easy to [create bindings to non-rust code](https://rust-embedded.github.io/book/interoperability/c-with-rust.html). 

Some people already decided to create bindings, but they are very limited and do not cover undocumented functions. The project with the best bindings is a fork of the official WinAPI rust bindings and has a `feature/km` branch. It can be found [here](https://github.com/Trantect/winapi-rs/tree/feature/km).

However, as I said before, sometimes there's no bindings available and we have to do it ourselves. Let's explore this with an example. Let's say you want to check if an address is valid. We can use the function `MmIsAddressValid` which checks for page faults on read or write operations. 

The first thing we need to do is create the definition of our function. 

```rust
pub type PVOID = *mut core::ffi::c_void;

extern "system" {
    pub fn MmIsAddressValid(VirtualAddress: PVOID) -> bool;
}
```

As you can see, I also created a type alias `PVOID`. Do you need that? No, but I want to keep the function definitions as close as possible to the original to reduce the number of errors when copy-pasting the definitions from MSDN.

Alright, how can we use this function? It's simple. Just call it with whatever parameters you'd like. 

```rust
let is_valid = unsafe { MmIsAddressValid(0 as _) };

println!("MmIsAddressValid(0) returned {}", is_valid);
```

If you try to run this, it'll not work because `println!()` is a macro defined in the standard library. So let's create our own custom log macro. 

```rust
pub use winapi::km::wdm::DbgPrint;

#[macro_export]
macro_rules! log {
    ($string: expr) => {
        unsafe {
            $crate::DbgPrint(concat!("[>] ", $string, "\0").as_ptr())
        }
    };

    ($string: expr, $($x:tt)*) => {
        unsafe {
            $crate::DbgPrint(concat!("[>] ", $string, "\0").as_ptr(), $($x)*)
        }
    };
}
```

This implementation is pretty straightforward. I decided not to create the definition for the function because the WinAPI crate already [defines it](https://github.com/Trantect/winapi-rs/blob/feature/km/src/km/wdm.rs#L771-L774). Moreover, I also added a prefix to all the messages. We also need to add the null byte (`\0`) so that the kernel knows where our string ends. The parameter for this function is just `*const u8` which is another way of saying "please give me a pointer to character array a.k.a. string" so we have to use the `.as_ptr()` function. 

After releasing this article, [daniel5151](https://www.reddit.com/user/daniel5151/) pointed out that this macro can be dangerous when used incorrectly. If you want to know more, check out his [comment](https://www.reddit.com/r/rust/comments/hrwyl8/writing_a_kernel_driver_with_rust/fy7fnyw/?context=3) on Reddit.

If you have worked with drivers before, you'll certainly know that you don't pass ANSI strings to functions. Windows decided to use the 16-bit character alternative: Unicode strings. Why would they do that? Well, as you probably know ANSI strings have 8 bits per character. So we can have 2^8 (255) different characters which is isn't that much. A single UNICODE character is 16 bits and can be one of 2^16 (65536) characters. Fun fact: It turns out that some people even [proposed to add Klingon](http://klingon.wiki/En/Unicode). 

So if we cannot pass ANSI strings, can we convert them? Of course we can, but it's a little tedious. The hard part is converting the 8-bit characters to 16-bit characters. I tried it multiple times but ended up using a crate for that: [obfstr](https://github.com/CasualX/obfstr). I'm just passing the wide string (`wchar *`) via the `obfstr::wide!()` macro and create the `UNICODE_STRING` structure with it. 

```rust
use winapi::shared::ntdef::UNICODE_STRING;

pub fn create_unicode_string(s: &[u16]) -> UNICODE_STRING {
    let len = s.len();

    let n = if len > 0 && s[len - 1] == 0 { len - 1 } else { len };

    UNICODE_STRING {
        Length: (n * 2) as u16,
        MaximumLength: (len * 2) as u16,
        Buffer: s.as_ptr() as _,
    }
}

let string = create_unicode_string(obfstr::wide!("Hello World!\0"));
```

Alright, let's go back to our example. We have finally everything that is needed to run it. We only need to adjust the [format specification syntax](https://docs.microsoft.com/en-us/cpp/c-runtime-library/format-specification-syntax-printf-and-wprintf-functions) and we are good to go.  

```rust
let is_valid = unsafe { MmIsAddressValid(0 as _) };

log!("MmIsAddressValid(0) returned %i", is_valid as u64);
```

Now that we covered the basics, let's explore the advantages of Rust. The function [PsLookupProcessByProcessId](https://docs.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-pslookupprocessbyprocessid) is used to get a pointer to the `EPROCESS` structure, but it also needs to be cleaned up using [ObfDereferenceObject](https://docs.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/nf-wdm-obdereferenceobject). If you use C you'd have to do that every time you want to return from the function. 

```c++
bool do_something(HANDLE process_id) {
    PEPROCESS process = nullptr;
    
    if !NT_SUCCESS(PsLookupProcessByProcessId(process_id, &process)) {
        return false;
    }

    if (some_condition) {
        ObDereferenceObject(process);
        return false;
    }
    
    if (some_condition) {
        ObDereferenceObject(process);
        return false;
    }

    ObDereferenceObject(process);
    return true;   
}
```

In Rust, you can define a wrapper structure and organize everything nicely together. You can easily extend this structure and for example add a function to get the base address but that's out of scope of this post. 

```rust
struct Process {
    process: PEPROCESS,
}

impl Process {
    pub fn by_id(process_id: u64) -> Option<Self> {
        let mut process = core::ptr::null_mut();

        let status = unsafe { PsLookupProcessByProcessId(process_id as _, &mut process) };
        if NT_SUCCESS(status) {
            Some(Self { process })
        } else {
            None
        }
    }
}
```

Now comes the important part: We can use the [Drop](https://doc.rust-lang.org/stable/rust-by-example/trait/drop.html) trait to automatically clean up the resources when the object goes out of scope. 

```rust
impl Drop for Process {
    fn drop(&mut self) {
        if !self.process.is_null() {
            unsafe { ObfDereferenceObject(self.process as _) }
        }
    }
}
```

This allows us to write the same code and we don't even have to care about cleaning up. We can even exit early if the process couldn't be found. Isn't it amazing? 

```rust
fn do_something(process_id: u64) -> Option<()> {
    let process = Process::by_id(process_id)?;

    if (some_condition) {
        return None;
    }
    
    if (some_condition) {
        return None;
    }

    return Some(());   
}
```

# Run and sign

So we finished our driver but how do we run it? There's multiple ways. For example, you can enable [testsigning mode](https://docs.microsoft.com/en-us/windows-hardware/drivers/install/the-testsigning-boot-configuration-option) by running `bcdedit.exe -set testsigning on` (requires Administrator privileges). After that, you need to sign your driver with a self-signed certificate. Visual Studio does this behind the scenes if you write a driver in C++ or C. We are going to use a tool called [cargo-make](https://github.com/sagiegurari/cargo-make) to automate this task. After installing it with `cargo install --force cargo-make` you have to create a file called `Makefile.toml` with the following content. 

```toml
[env.development]
TARGET_PATH = "target/x86_64-pc-windows-msvc/debug"

[env.production]
TARGET_PATH = "target/x86_64-pc-windows-msvc/release"
BUILD_FLAGS = "--release"

[tasks.build-driver]
script = [
    "cargo b %BUILD_FLAGS%"
]

[tasks.rename]
ignore_errors = true
script = [
    "cd %TARGET_PATH%",
    "rename driver.dll driver.sys",
]

[tasks.sign]
dependencies = ["build-driver", "rename"]
script = [
    # Load the Visual Studio Developer environment
    "call \"%ProgramFiles(x86)%\\Microsoft Visual Studio\\2019\\Community\\VC\\Auxiliary\\Build\\vcvars64.bat\"",

    # Create a self signed certificate (only if not already done)
    "if not exist DriverCertificate.cer ( makecert -r -pe -ss PrivateCertStore -n CN=DriverCertificate DriverCertificate.cer ) else ( echo Certificate already exists. )",

    # Sign the driver
    "signtool sign /a /v /s PrivateCertStore /n DriverCertificate /t http://timestamp.digicert.com %TARGET_PATH%/driver.sys"
]
```

We defined three tasks: 
- **build-driver**: Builds the project either in debug or release mode.
- **rename**: Renames the `.dll` to `.sys`. We also specify `ignore_errors` just in case the file has already been renamed. 
- **sign**: Creates a certificate (if not already done) and signs the driver. This task depends on the two previous steps `build-driver` and `rename`. 

After running `cargo make sign` or `cargo make sign --profile production` you can load the driver either from the command line or via the [OSR Driver Loader](http://www.osronline.com/article.cfm%5Earticle=157.htm). You can view the `DbgPrint` output with [DebugView](https://docs.microsoft.com/en-us/sysinternals/downloads/debugview). 

There's also various other ways of getting access to the kernel. Almost all of them require vulnerable drivers which can be abused to allocate kernel memory and call kernel functions. Widely known projects utilizing this technique are [TDL](https://github.com/hfiref0x/TDL), [drvmap](https://github.com/not-wlan/drvmap), [kdmapper](https://github.com/z175/kdmapper) and many more. Because these projects are abusing vulnerabilities, loading your driver is not safe and might cause your computer to bluescreen. 

# Mistakes, errors and problems

### Wrong data types

Rewriting structures in Rust can often be complicated and a lot of effort because Microsoft uses so many aliases for their types. That's why you have to be careful to choose the correct data types. I ended up writing a driver in C++ that just prints the size of a specific structure and compared it to be sure that I didn't mess it up. 

### No official bindings

[Microsoft is certainly interested in using Rust for Safe Systems Programming](https://thenewstack.io/microsoft-rust-is-the-industrys-best-chance-at-safe-systems-programming/) and has recently released [Rust bindings for C++/WinRT](https://github.com/microsoft/winrt-rs). The [WinAPI Rust bindings](https://github.com/retep998/winapi-rs) are still managed by the community and do not include the Windows Kernel API. There's a [fork](https://github.com/Trantect/winapi-rs/tree/feature/km) available that started creating bindings but it's far from perfect. I wish to see more progress in the development of these bindings from Microsoft.  

### Lack of nostd crates

Rust has lots of useful crates that speedup software development quite a lot, but a large portion of these crates heavily rely on the standard library. I can understand the authors: It's often not worth the effort to invest more time for something that will hardly be used. However, I'm sure this will continue to improve as more people and companies are starting to recognize the advantages of Rust for embedded and systems programming. 

### Heap allocations

When I first started writing drivers in Rust, I thought it was simply not possible to use collections like `Vec`, `String` or `HashMap` but then I found [this](https://rust-embedded.github.io/book/collections/index.html) page in the Embedded Book. It certainly would have been nice to use these collections, but in the end it didn't really matter. I hardly ever needed them and didn't really notice a difference. 

# Conclusion

Using Rust for all kinds of projects is fun. No matter if you want to write a game in the browser using WASM, develop a CLI tool or whether you want to explore the depths of the kernel. Writing kernel drivers in Rust is certainly unusual but you can utilize the strong type system and for example the `Drop` trait to reduce the number of bugs at compile-time. The source code for the driver can be found [here](https://github.com/not-matthias/kernel-driver-with-rust).

It has been a long time since I wrote a blog post, I hope you enjoyed reading it. I'd love to hear your thoughts and opinions about this topic.  

Thanks for reading!
