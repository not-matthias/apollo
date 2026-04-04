+++
title = "Line Highlighting Example"
date = "2026-04-04"

[taxonomies]
tags=["test"]
+++

This page demonstrates Zola's [code block annotations](https://www.getzola.org/documentation/content/syntax-highlighting/) supported by the Apollo theme.

# Line Numbers

Use `linenos` to enable line numbering.

    ```rust,linenos
    fn main() {
        println!("Hello World");
        let x = 42;
    }
    ```

```rust,linenos
fn main() {
    println!("Hello World");
    let x = 42;
}
```

# Single Line Highlighting

Use `hl_lines=2` to highlight a specific line.

    ```rust,linenos,hl_lines=2
    fn main() {
        println!("Hello World");
        let x = 42;
    }
    ```

```rust,linenos,hl_lines=2
fn main() {
    println!("Hello World");
    let x = 42;
}
```

# Multi-Line Highlighting

Use `hl_lines=2 3` to highlight multiple lines.

    ```rust,linenos,hl_lines=2 3
    fn main() {
        println!("Hello World");
        let x = 42;
    }
    ```

```rust,linenos,hl_lines=2 3
fn main() {
    println!("Hello World");
    let x = 42;
}
```

# Range Highlighting

Use `hl_lines=1-3` to highlight a range of lines.

    ```rust,linenos,hl_lines=1-3
    fn main() {
        println!("Hello World");
        let x = 42;
    }
    ```

```rust,linenos,hl_lines=1-3
fn main() {
    println!("Hello World");
    let x = 42;
}
```

# Custom Line Number Start

Use `linenostart=10` to start line numbers at a specific value.

    ```rust,linenos,linenostart=10
    fn main() {
        println!("Hello World");
        let x = 42;
    }
    ```

```rust,linenos,linenostart=10
fn main() {
    println!("Hello World");
    let x = 42;
}
```

# Hidden Lines

Use `hide_lines=2` to hide specific lines from the output.

    ```rust,linenos,hide_lines=2
    fn main() {
        println!("Hello World");
        let x = 42;
    }
    ```

```rust,linenos,hide_lines=2
fn main() {
    println!("Hello World");
    let x = 42;
}
```
