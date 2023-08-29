+++
title = "Tailcalls in eBPF"
date = "2023-0X-XX"
+++

//## If you are looking for...
//
//-   What are tail calls? <br />
//-   What are bpf to bpf calls? <br />
//-   Why each bpf program is restricted to 256 bytes when both bpf to bpf and tail calls are used together and  Why the number of tailcall are restricted to 32 and How it is being restricted?<br />
//-   How to implement tail calls(chaining, using bpf to bpf and chain calls together)? <br />
//-   How to update the bpf map used by bpf_tail_call in runtime? <br />
//
//
//## tail calls in BPF
//
//In a BPF program, tail calls are used to call an another BPF program without returning to the previous program. Same as tailcall recursion/ optimization/ elimination, BPF tailcall program uses the same stack frame of the caller program. <br />
//
//If you are not familiar with tailcall optimization, checkout [wikipedia](https://en.wikipedia.org/wiki/Tail_call), [eklitzke blog post](https://eklitzke.org/how-tail-call-optimization-works) and [computerphile youtube video](https://www.youtube.com/watch?v=_JtPhF8MshA) <br />
//
//## bpf to bpf calls
//
//Previouly there is no function call support for bpf programs. For reusability `always_inline` functions are used. These inlined functions are duplicated many times in the object file so bpf to bpf calls are introduced. <br />
//
//Then to answer why exactly each BPF program is restricted to 256 bytes when it used together with tailcalls and bpf to bpf calls and why tailcall are limited to 33. we need to know that each BPF program should 512 bytes and linux kernel stack size for x86 is 16kb. By keeping these two points in our mind let's get into our explanation <br />
//
//For Suppose we have a BPF program of size: `511 bytes` <br />
//now at the end of the program we made bpf to bpf which consumed stack size: 1 byte <br />
//
//Inside this bpf to bpf call let's call a tailcall which uses this 1 byte stack frame but consumed stack size: `511 bytes`<br />
//
//so till now we have consumed 1022 bytes of stack and we have used only 1 tail call. if you continued to do this chaining till 33 tailcall, the total amount of stack we consume is `33 * 511 = 16863`. which exhaust the kernel stack results in stackoverflow. <br />
//
//For Suppose if we restrict the stack size of each bpf program to 256 bytes when both bpf to bpf and tailcalls are used together then bpf programs atmost uses `255 * 33 = 8415` viz, nearly 8kb. <br />
//
//BPF verifier is restricting the size of subprograms to 256 bytes and JIT is restricting the tailcall count to 33. (In the below implementations I will provide the objdump for chaining of tailcall programs and show you how exactly limit is enforced on tailcalls during runtime) 
//
//
//## Implementing a simple tailcall program and attaching it with userspace code and bpftool
//
//**Kernel Code:**
//
//```c
//
//```
//
//
//
