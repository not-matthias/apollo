+++
title = "Note Component Example"
date = "2024-06-14"

[taxonomies]
tags=["example"]

[extra]
comment = true
+++


## Note

Here is an example of the `note` component:

This one is static!
{% <note header="Note!"> %}This blog assumes basic terminal maturity{% </note> %}

This one is clickable!
{% <note clickable={true} hidden={true} header="Quiz!"> %}The answer to the quiz!{% </note> %}


Syntax:
{% raw %}
```
{% <note header="Note!"> %}This blog assumes basic terminal maturity{% </note> %}
{% <note clickable={true} hidden={true} header="Quiz!"> %}The answer to the quiz!{% </note> %}
```
{% endraw %}

You can also use some HTML in the text:
{% <note header="Note!"> %}<h1>This blog assumes basic terminal maturity</h1>{% </note> %}


Literal component:
{% raw %}
```
{% <note header="Note!"> %}<h1>This blog assumes basic terminal maturity</h1>{% </note> %}
```
{% endraw %}

Pretty cool, right?

Finally, you can do something like this (hopefully):

{% <note clickable={true} header="Quiz!"> %}

# Hello this is markdown inside a note component

```rust
fn main() {
    println!("Hello World");
}
```

We can't call another component inside a component, but this is good enough.

{% </note> %}

Here is the raw markdown:

{% raw %}
```markdown
{% <note clickable={true} header="Quiz!"> %}

# Hello this is markdown inside a note component

\`\`\`rust
fn main() {
    println!("Hello World");
}
\`\`\`

We can't call another component inside a component, but this is good enough.

{% </note> %}
```
{% endraw %}

Finally, we have center
{% <note center={true} header="Centered Text"> %}This is centered text{% </note> %}

{% raw %}
```markdown
{% <note center={true} header="Centered Text"> %}This is centered text{% </note> %}
```
{% endraw %}
It works good enough for me!
