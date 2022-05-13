---
title: "Why Java doesn't optimize"
date: "2021-12-13"
---

It was a nice monday evening, and I decided to take a look at the feedback of my university homeworks. More specifically, the feedback of my compiler construction homework. I got around 95-100% on the exercises, so I can't complain. But one thing caught my eye. 

I got this feedback on my last exercise: `you create a complete new boolean in each loop -> inefficient -1`. I wasn't sure what this comment was referring to, so I had to look it up (thankfully they added the line numbers). 
The code looks like this: 

```java
private void recoverMethodDecl() {
    error(METH_DECL);

    while (true) {
        boolean isEof = sym == Token.Kind.eof;
        boolean isVoid = sym == Token.Kind.void_;
        boolean isType = tab.find(sym.name()).kind == Obj.Kind.Type;

        if (!isEof && !isVoid && !isType) {
            scan();
        } else {
            break;
        }
    }
}
```

I'll explain a little bit of the context. This code is part of the compiler we are currently writing in the [Compiler Construction](https://ssw.jku.at/Teaching/Lectures/UB/VL/) lecture. We are building our own compiler for a language called `MicroJava`. It has similar syntax compared to Java, but is much easier and more minmalistic. 

An important part of compiler construction is the error handling and that's exactly what this method does. When the user enters an invalid method declaration (for example `void foo[);`) then we want to find a point where we can safely continue again. In this case, we are looking for `eof` (end of the program), `void` (a new method declaration) or `type` (a new function with return value). There's also the method calls `tab.find()` (just looks up the symbol in the [symbol table](https://en.wikipedia.org/wiki/Symbol_table)) and `sym.name()`, but they are not important. 

Don't worry if you didn't understand everything, that's not the focus of this blog post. 

So when I read the feedback and saw this code snippet, I remembered that I didn't inline it, because I thought that the Java Compiler **surely** has some optimizations passes that will do that for me. 

Since I have lots of experience with compiled languages like Rust and C++, I assumed that the compiler will just inline the variables for me. I knew that Java had massive performance problems in the early version and that they fixed them later. I also have some experience with LLVM and compiler optimization, so I presumed that they just implemented something similar.

Because of that, I wanted to prove that it doesn't matter whether I create new variables or not. 

---

Since I have reverse engineered Android apps and other Java applications before, I wasn't scared of digging into the Java Bytecode. Luckily, that wasn't necessary. I could compile the project to a `.jar` and open it in [JD-GUI](https://java-decompiler.github.io/). 

The decompiled code from above looks like this:

```java
private void recoverMethodDecl() {
    error(Errors.Message.METH_DECL, new Object[0]);
    while (true) {
        boolean isEof = (this.sym == Token.Kind.eof);
        boolean isVoid = (this.sym == Token.Kind.void_);
        boolean isType = ((this.tab.find(this.sym.name())).kind == Obj.Kind.Type);
        if (!isEof && !isVoid && !isType) {
            scan();
            continue;
        } 
        break;
    } 
}
```

Looks pretty similar, huh? For comparison, the disassembly for the inlined version looks like this:

```java
private void recoverMethodDecl() {
    error(Errors.Message.METH_DECL, new Object[0]);
    while (this.sym != Token.Kind.eof && this.sym != Token.Kind.void_ && (this.tab.find(this.sym.name())).kind != Obj.Kind.Type && (this.tab.find(this.sym.name())).kind != Obj.Kind.Prog)
        scan(); 
}
```

That looks more like it. Even when comparing the Java bytecode, I can clearly see the differences. 

Because of that, I began thinking about another scenario: 
Maybe something else had happened. Maybe the Java Compiler noticed the function calls `tab.find()` and `sym.name()` and didn't follow them. So if the compiler doesn't know about what the function does inside, it can't change the control flow. Because what if the function `tab.find()` also increases a counter `timesCalled` internally? If we inline it, it might not get called. 

Let's think about this with an example. If `modifySomethingInternally` modifies some variable internally (or calls other functions that do that), then the compiler can't inline it, because if `a` is already `true` then this function would never get called.

```java
boolean a = true;
boolean b = foo.modifySomethingInternally();

if (a || b) {
    System.out.println("a || b");
} 
```

You might have noticed that I used `||` instead of `&&` like in the example above here. Sadly, this doesn't change anything, because the compiler still can't inline it. Why? Because if `a` is false, then you don't even need to consider the alternative cases. 

```java
boolean a = false;
boolean b = foo.modifySomethingInternally();

if (a && b) {
    System.out.println("a && b");
} 
```

**This brings up an important question**: If this was truly the case, why didn't the compiler inline `isVoid` and `isEof`? With the reasoning from above, the compiler should easily be able to figure out that these variables are used nowhere else.

Not knowing where to continue, I wanted to try one more thing. We've been using Java 8 for our compiler, so I thought that maybe a newer compiler might have better optimizations. I couldn't have been more wrong. I tried to compile it with Java 16 and compared the bytecode and decompiled code again and it didn't change a thing. 

So it really seems like Java doesn't do any optimizations. This would also explain why the decompilers are working so good. 
At this point, I even thought: "Maybe this is the reason why Java is so slow".

---

Because I failed to prove my point, I decided to go to a place where I could potentially find answers: the Internet. 

I found [this](https://stackoverflow.com/a/4516830) Stackoverflow post, which showed cases where **JIT offers better performance than static compilation**. Some optimizations that are only feasible at runtime are:
- [Just in Time Compilation](https://en.wikipedia.org/wiki/Just-in-time_compilation) that uses processor specific features like [SIMD](https://en.wikipedia.org/wiki/Streaming_SIMD_Extensions). 
- Collect statistics about how the program runs in the environment and optimize based on that. (Note: [Profile-guided optimization](https://en.wikipedia.org/wiki/Profile-guided_optimization) does the same)
- Rearrange code for better cache utilization.
- Global code optimizations (e.g. inlining of library functions) without losing the advantages of dynamic linking and without the overheads inherent to static compilers and linkers

While these features sound exciting at first, I'm sure that you can achieve just as good performance using a statically compiled language. The first point is already available in almost all compilers and the only hurdle is the distribution, since you either need to distribute multiple binaries or use something like [multiversion](https://github.com/calebzulawski/multiversion) to compile multiple implementations of a function based on the available cpu features. 

I found [another post](https://stackoverflow.com/questions/5981460/optimization-by-java-compiler) that explained more about the optimizations in the Java Compiler. Turns out, there aren't any (or at least only very simple ones). The posts made it very clear, that the JIT compiler is actually much better than I thought: 

> The point is that the JIT compiler does most of the optimization - and it works best if it has a lot of information, some of which may be lost if javac performed optimization too. If javac performed some sort of loop unrolling, it would be harder for the JIT to do that itself in a general way - and it has more information about which optimizations will actually work, as it knows the target platform.

---

I'm on the one hand fascinated that the JIT compiler can achieve such great performance, but also a little disappointed that they abstract so much information away. At the end, it's basically a black box where you have few options to figure out how to profile or optimize your code. I guess that's good enough for most people. 

Being able to pop the binary into the binary in [IDA](https://hex-rays.com/ida-pro/) or [Binary Ninja](https://binary.ninja/) and see the code that will be executed by the processor is something that I've really liked in languages like Rust or C++. There are also much more tools around to help with that, so I guess I could also be biased.

---

**So did I prove my point?** Not really, but I'm not so sure that the feedback is really correct. It clearly mentions the inefficiency of my code and not the size on disk. So the speed only depends on the JIT compilation. I'm sure I could profile the function, but I'm not sure if that will even show great differences in the performance. Why? Because the first rule of optimization is: **Don't bother optimizing one-time costs**. So unless you have hundreds of invalid method declarations in your code, the function will either get called very little or even never. 

---

Did I really just spend 3 hours writing this blog post because of `-1` point out of `24`? Maybe. 
