+++
title = "Shortcode Example"
date = "2024-06-14"
+++

Here is an example of the `note` shortcode:

This one is static!
{{ note(header="Note!", text="This blog assumes basic terminal maturity") }}

This one is clickable!
{{ note(clickable=true, header="Quiz!", text="The answer to the quiz!") }}


Syntax:
```
{{/* note(header="Note!", text="This blog assumes basic terminal maturity") */}}
{{/* note(clickable=true, header="Quiz!", text="The answer to the quiz!") */}}
```

You can also use some HTML in the text:
{{ note(header="Note!", text="<h1>This blog assumes basic terminal maturity</h1>") }}


Literal shortcode:
```
{{/* note(header="Note!", text="<h1>This blog assumes basic terminal maturity</h1>") */}}
```

Pretty cool, right?
