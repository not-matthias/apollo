+++
title = "Tailcalls in eBPF"
date = "2023-09-01"
+++

## If you are looking for...

-   What are tail calls? <br />
-   What are bpf to bpf calls? <br />
-   Why each bpf program is restricted to 256 bytes when both bpf to bpf and tail calls are used together and  Why the number of tailcall are restricted to 33 and How it is being restricted?<br />
-   How to implement tail calls(chaining, using bpf to bpf and chain calls together)? <br />
-   How to update the bpf map used by bpf_tail_call in runtime? <br />


## tail calls in BPF

In a BPF program, tail calls are used to call an another BPF program without returning to the previous program. Same as tailcall recursion/ optimization/ elimination, BPF tailcall program uses the same stack frame of the caller program. <br />

If you are not familiar with tailcall optimization, checkout [wikipedia](https://en.wikipedia.org/wiki/Tail_call), [eklitzke blog post](https://eklitzke.org/how-tail-call-optimization-works) and [computerphile youtube video](https://www.youtube.com/watch?v=_JtPhF8MshA) <br />

## bpf to bpf calls

Previouly there is no function call support for bpf programs. For reusability `always_inline` functions are used. These inlined functions are duplicated many times in the object file so bpf to bpf calls are introduced. <br />

Then to answer why exactly each BPF program is restricted to 256 bytes when it used together with tailcalls and bpf to bpf calls and why tailcall are limited to 33, we need to know that each BPF program should be of size 512 bytes and linux kernel stack size for x86 is 16kb. By keeping these two points in our mind let's get into our explanation <br />

For Suppose we have a BPF program of size: `511 bytes` <br />
now at the end of the program we made bpf to bpf call which consumed stack size: 1 byte <br />

Inside this bpf to bpf call let's call a tailcall which uses this 1 byte stack frame but consumed stack size: `511 bytes`<br />

so till now we have consumed 1022 bytes of stack and we have used only 1 tail call. if you continued to do this chaining till 33 tailcall, the total amount of stack we consume is `33 * 511 = 16863`. which exhaust the kernel stack results in stackoverflow. <br />

For Suppose if we restrict the stack size of each bpf program to 256 bytes when both bpf to bpf and tailcalls are used together then bpf programs atmost uses `255 * 33 = 8415` viz, nearly 8kb. <br />

BPF verifier is restricting the size of subprograms to 256 bytes and JIT is restricting the tailcall count to 33. (In the below implementations I will provide the objdump for chaining of tailcall programs and show you how exactly limit is enforced on tailcalls during runtime) 


## Implementing a simple tailcall program and attaching it with userspace code and bpftool

**Kernel Code:**
```c
#include <bpf/bpf_helpers.h>
#include <linux/version.h>
#include <uapi/linux/bpf.h>
#include <bpf/bpf_tracing.h>


SEC("tracepoint/syscalls/sys_enter_execve")
int testing_tailcall(void *ctx){
	
	bpf_printk("testing_tailcall function\n");
	return 0;
}

struct {
	__uint(type, BPF_MAP_TYPE_PROG_ARRAY);
	__uint(max_entries, 2);
	__uint(key_size, sizeof(__u32));
	__array(values, int(void *));
} prog_array SEC(".maps") = {
	.values = {
		[1] = (void *)&testing_tailcall,
	},
};


SEC("tracepoint/syscalls/sys_enter_execve")
int trace_enter_execve(void *ctx){
	
	bpf_printk("trace_enter_execve function\n");
	bpf_tail_call(ctx, &prog_array, 1);

	return 0;
}

char _license[] SEC("license") = "GPL";
u32 _version SEC("version") = LINUX_VERSION_CODE;
```

**Userspace Code**
```c
#include <errno.h>
#include <stdlib.h>
#include <stdio.h>
#include <bpf/bpf.h>
#include <bpf/libbpf.h>


int main(int argc, char **argv){
    
    struct bpf_link *link = NULL;
    struct bpf_program *prog;
    struct bpf_object *obj;

    char filename[256];
    snprintf(filename, sizeof(filename), "%s_kern.o", argv[0]);

    obj = bpf_object__open_file(filename, NULL);
    if(libbpf_get_error(obj)){
        fprintf(stderr, "Error: opening BPF obj file");
        return 0;
    }

    prog = bpf_object__find_program_by_name(obj, "trace_enter_execve");
    if(!prog){
        fprintf(stderr,"finding the prog in the object file failed\n");
        goto cleanup;
    }

    if (bpf_object__load(obj)) {
                fprintf(stderr, "ERROR: loading BPF object file failed\n");
                goto cleanup;
    }

    link = bpf_program__attach(prog);
    if(libbpf_get_error(link)){
        fprintf(stderr, "ERROR: bpf_program__attach failed : %ld\n", libbpf_get_error(link));
        link = NULL;
        goto cleanup;
    }else{
        fprintf(stderr, "Attachment is done\n");
    }

    read_trace_pipe();
    cleanup:
            bpf_link__destroy(link);
            bpf_object__close(obj);
            return 0;

}
```
**Triggering program**
```
#include <unistd.h>
#include <stdio.h>
#include <linux/unistd.h>

int main(void){
    printf("triggering syscall\n");
    return syscall(60); // sys_exit
}
```

**Series of Commands to attach and trigger the programs**
```bash

# to generate the bpf executable file checkout Makefile in samples/bpf
sleep 5 && ./trigger_program #this will trigger a syscall after 5 seconds
./tailcall_program # after compiling run the tailcall_program, ofcourse inside a vm :)

#With Bpftool without userspace code
bpftool prog loadAll tailcall_kern.o /sys/fs/bpf/test autoattach
./trigger_program # check debug messages in /sys/kernel/debug/tracing/trace_pipe
```


## Implementing tailcalls and bpf2bpf calls together

**Kernel Code**
```c
include <bpf/bpf_helpers.h>
#include <linux/version.h>
#include <uapi/linux/bpf.h>
#include <bpf/bpf_tracing.h>

#define MAX_SSIZE 128 
SEC("tracepoint/syscalls/sys_enter_execve")
int testing_tailcall(void *ctx){
	
	
	bpf_printk("testing_tailcall function\n");
	
	return 0;
}

struct {
	__uint(type, BPF_MAP_TYPE_PROG_ARRAY);
	__uint(max_entries, 2);
	__uint(key_size, sizeof(__u32));
	__array(values, int(void *));
} prog_array SEC(".maps") = {
	.values = {
		[1] = (void *)&testing_tailcall,
	},
};

static __attribute__((__noinline__)) int test_bpf2bpf_call(void *ctx){
	
	
	bpf_tail_call(ctx, &prog_array, 1);
	

	return 0;
}

SEC("tracepoint/syscalls/sys_enter_execve")
int trace_enter_execve(void *ctx){
	
	test_bpf2bpf_call(ctx);


	return 0;
}

char _license[] SEC("license") = "GPL";
u32 _version SEC("version") = LINUX_VERSION_CODE;
```

-- Attaching and triggering mechanism is similar to the above program, so I am not including the Userspace and triggering Code.

## Program to Maxout Number of tailcalls
```c
#include <bpf/bpf_helpers.h>
#include <linux/version.h>
#include <uapi/linux/bpf.h>
#include <bpf/bpf_tracing.h>


SEC("fentry/__x64_sys_execve")
int testing_func5(void *ctx){
    bpf_printk("inside tail-call 5");
    return 0;
}

struct {
	__uint(type, BPF_MAP_TYPE_PROG_ARRAY);
	__uint(max_entries, 10);
	__uint(key_size, sizeof(__u32));
	__array(values, int (void *));
} prog_array_init5 SEC(".maps") = {
	.values = {
		[1] = (void *)&testing_func5,
	},
};
SEC("fentry/__x64_sys_execve")
int testing_func4(void *ctx){
    bpf_printk("inside tail-call 4");
    bpf_tail_call(ctx, &prog_array_init5, 1);
    return 0;
}

struct {
	__uint(type, BPF_MAP_TYPE_PROG_ARRAY);
	__uint(max_entries, 10);
	__uint(key_size, sizeof(__u32));
	__array(values, int (void *));
} prog_array_init4 SEC(".maps") = {
	.values = {
		[1] = (void *)&testing_func4,
	},
};

#define RTAIL_CALL(X, Y) \
SEC("fentry/__x64_sys_execve") \
int testing_func ## X(void *ctx){ \
    bpf_printk("inside tail-call %s",#X); \
    bpf_tail_call(ctx, &prog_array_init##Y, 1); \
    return 0; \
} \
struct { \
	__uint(type, BPF_MAP_TYPE_PROG_ARRAY); \
	__uint(max_entries, 2); \
	__uint(key_size, sizeof(__u32)); \
	__array(values, int (void *)); \
} prog_array_init##X SEC(".maps") = { \
	.values = { \
		[1] = (void *)&testing_func##X, \
	}, \
} \

RTAIL_CALL(3, 4);
RTAIL_CALL(2, 3);


SEC("fentry/__x64_sys_execve")
int testing_func(void *ctx){
    bpf_printk("inside tail-call 1");

    bpf_tail_call(ctx, &prog_array_init2, 1);
    return 0;
}


struct {
	__uint(type, BPF_MAP_TYPE_PROG_ARRAY);
	__uint(max_entries, 10);
	__uint(key_size, sizeof(__u32));
	__array(values, int (void *));
} prog_array_init SEC(".maps") = {
	.values = {
		[1] = (void *)&testing_func,
	},
};




SEC("fentry/__x64_sys_execve")
int trace_enter_execve(struct pt_regs *ctx)
{	
    bpf_printk("Inside Kernel Main Function");

    bpf_tail_call(ctx, &prog_array_init, 1);

    return 0;	
}

char _license[] SEC("license") = "GPL";
u32 _version SEC("version") = LINUX_VERSION_CODE;
```

```Jitted Code
 int trace_enter_execve(struct pt_regs *ctx)
   4:	nopl   0x0(%rax,%rax,1)
   9:	xor    %eax,%eax
   b:	push   %rbp
   c:	mov    %rsp,%rbp
   f:	endbr64
  13:	push   %rax
  14:	push   %rbx
 bpf_tail_call(ctx, &prog_array_init34, 1);
  45:	mov    -0x4(%rbp),%eax
  4b:	cmp    $0x21,%eax
  4e:	jae    0x0000000000000065
  50:	add    $0x1,%eax
  53:	mov    %eax,-0x4(%rbp)
  59:	jmp    0xffffffffffffff5b
; return 0;
  65:	xor    %eax,%eax
  67:	pop    %rbx
  68:	leave
  69:	ret
```

-- The above is the snapshot of a jitted code from a tailcall program, 

## Program to update Tailcall Map from Userspace

