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

BPF verifier is restricting the size of subprograms to 256 bytes and JIT is restricting the tailcall count to 33. (In the below implementations I will provide the jitted code for chaining of tailcall programs and show you how exactly limit is enforced on tailcalls during runtime) 


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

**Kernel Code**
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

```asm
0xffffffffa00020a8:	endbr64
   0xffffffffa00020ac:	nopl   0x0(%rax,%rax,1)
   0xffffffffa00020b1:	xor    %eax,%eax
   0xffffffffa00020b3:	push   %rbp
   0xffffffffa00020b4:	mov    %rsp,%rbp
   0xffffffffa00020b7:	endbr64
   0xffffffffa00020bb:	push   %rax
   0xffffffffa00020ed:	mov    -0x4(%rbp),%eax
   0xffffffffa00020f3:	cmp    $0x21,%eax
   0xffffffffa00020f6:	jae    0xffffffffa000210d
   0xffffffffa00020f8:	add    $0x1,%eax
   0xffffffffa00020fb:	mov    %eax,-0x4(%rbp)
   0xffffffffa0002101:	nopl   0x0(%rax,%rax,1)
   0xffffffffa0002106:	pop    %rbx
   0xffffffffa0002107:	pop    %rax
   0xffffffffa0002108:	jmp    0xffffffffa0002007
   0xffffffffa000210d:	xor    %eax,%eax
   0xffffffffa000210f:	pop    %rbx
```

-- The above is the abridged snapshot of jitted code of the starting program that is calling a tailcall, in ins 9 we 
   can see that eax is set to 0. and in ins 13 and 14 both rax and rbp values are pushed. In ins 45, earlier pushed rax 
   value is accessed and moved to eax. then it is compared if it's count is equal to 33 if it 33 then it jump to ins 65 
   otherwise eax is incremented by 1 and moved to earlier position

```asm
   0xffffffffa0002007:	endbr64
   0xffffffffa000200b:	push   %rax
   0xffffffffa000200c:	push   %rbx
   0xffffffffa000200d:	mov    %rdi,%rbx
   0xffffffffa0002010:	movabs $0xffff88800712a530,%rdi
   0xffffffffa000201a:	mov    $0x13,%esi
   0xffffffffa000201f:	mov    -0x8(%rbp),%rax
   0xffffffffa0002026:	call   0xffffffff811cd720
   0xffffffffa000202b:	mov    %rbx,%rdi
   0xffffffffa000202e:	movabs $0xffff888006af0000,%rsi
   0xffffffffa0002038:	mov    $0x1,%edx
   0xffffffffa000203d:	mov    -0x4(%rbp),%eax
   0xffffffffa0002043:	cmp    $0x21,%eax
   0xffffffffa0002046:	jae    0xffffffffa000205d
   0xffffffffa0002048:	add    $0x1,%eax
   0xffffffffa000204b:	mov    %eax,-0x4(%rbp)
   0xffffffffa0002051:	nopl   0x0(%rax,%rax,1)
   0xffffffffa0002056:	pop    %rbx
  0xffffffffa0002057:	pop    %rax
   0xffffffffa0002058:	jmp    0xffffffffa0001f27
   0xffffffffa000205d:	xor    %eax,%eax
   0xffffffffa000205f:	pop    %rbx
```

-- this is the jitted code after the jump to the tailcall.

```bash
# For real jump target above we are using gdb
tail  /proc/kallsyms
gdb -q -c /proc/kcore -ex 'x/30i ffffffffa00020a8' -ex 'quit'
gdb -q -c /proc/kcore -ex 'x/30i 0xffffffffa0002007' -ex 'quit'
```

## Program to update Tailcall Map from Userspace by pinning(for simple update of map you can check out selftest folder in the kernel)

**Kernel Code**

```C
#include <bpf/bpf_helpers.h>
#include <linux/version.h>
#include <uapi/linux/bpf.h>
#include <bpf/bpf_tracing.h>



SEC("fentry/__x64_sys_execve")
int testing_func_user(void *ctx){
    bpf_printk("inside testing_func_user");

    return 0;
}

SEC("fentry/__x64_sys_execve")
int testing_func(void *ctx){
    bpf_printk("inside testing_func");

    return 0;
}

struct {
	__uint(type, BPF_MAP_TYPE_PROG_ARRAY);
	__uint(pinning, LIBBPF_PIN_BY_NAME);
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

**Userspace Code for attaching**
```C
#include <errno.h>
#include <stdlib.h>
#include <stdio.h>
#include <bpf/bpf.h>
#include <bpf/libbpf.h>

#define BPF_SYSFS_ROOT "/sys/fs/bpf"


int main(int argc, char **argv){

    struct bpf_link *link = NULL;
    struct bpf_program *prog;
    struct bpf_program *tailcall_prog;
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

    tailcall_prog = bpf_object__find_program_by_name(obj, "testing_func_user");
    if(!prog){
        fprintf(stderr,"finding the testing_prog in the object file failed\n");
        goto cleanup;
    }

    if (bpf_object__load(obj)) {
                fprintf(stderr, "ERROR: loading BPF object file failed\n");
                goto cleanup;
    }

    char pfilename[256];
    int len = snprintf(pfilename, 256, "%s/%s", BPF_SYSFS_ROOT, "tailcall_prog");
    bpf_program__pin(tailcall_prog, pfilename);


    link = bpf_program__attach(prog);
    if(libbpf_get_error(link)){
        fprintf(stderr, "ERROR: bpf_program__attach failed : %ld\n", libbpf_get_error(link));
        link = NULL;
        goto cleanup;
    }else{
        fprintf(stderr, "Attachment is done\n");
    }
	while(1);
    read_trace_pipe();
    cleanup:
            bpf_link__destroy(link);
            bpf_object__close(obj);
            return 0;

}

```

**Userspace Code for updating the map**
```C
#include <errno.h>
#include <stdlib.h>
#include <stdio.h>
#include <bpf/bpf.h>
#include <bpf/libbpf.h>


int main(int argc, char **argv)
{
    int ret = -1;
    const char *pinned_file = "/sys/fs/bpf/prog_array_init";
    const char *pinned_file2 = "/sys/fs/bpf/tailcall_prog";

    int map_fd = bpf_obj_get(pinned_file);
    if(map_fd<0){
        fprintf(stderr, "bpf_obj_get(%s): %s(%d)\n",
                pinned_file, strerror(errno), errno);
        goto out;
    }


    int tail_prog_fd = bpf_obj_get(pinned_file2);
    int key = 1;
    bpf_map_update_elem(map_fd, &key, &tail_prog_fd, 0);

out:
    if(map_fd!= -1)
        close(map_fd);
    return ret;

}
```

## References
[Cloud Fare Blog by Jakub Sitnicki](https://blog.cloudflare.com/assembly-within-bpf-tail-calls-on-x86-and-arm/#:~:text=Tail%20calls%20can%20be%20seen,reusing%20the%20same%20stack%20frame)
<br />[Cilium Docs](https://docs.cilium.io/en/stable/bpf/architecture/#tail-calls)



I am able to write this blog because of my work in ROSA LAB@Virginia Tech. So I would like to thank Prof Dan Williams and everyone in my lab
for your support.

