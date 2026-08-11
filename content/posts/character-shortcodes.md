+++
title = "Character Components Example"
date = "2025-08-11"
+++

This example uses the `character` component to add dialogue and interactive characters to posts.

{% <character name="hooded"> %}Whaaaaaaaaaaaaaaaaaaat, that's almost 70 years ago???{% </character> %}

I know, it's crazy. Here's an example program:

```
PROGRAM MAIN
PRINT *, 'HELLO WORLD'
STOP
END
```

{% <character name="hooded"> %}
There's also a more modern version which is a bit easier to read:
```
program helloWorld
   print *, "Hello World!"
end program helloWorld
```
{% </character> %}

Good to know, thanks buddy!

{% <character position="left"> %}:){% </character> %}

{% <character position="right" image="hooded.png"> %}custom image{% </character> %}
