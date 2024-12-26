+++
title = "Mermaid Example"
date = "2024-12-26"

[taxonomies]
tags=["example"]

[extra]
comment = true
+++

{% mermaid() %}
graph LR
    A[Start] --> B[Initialize]
    B --> C[Processing]
    C --> D[Complete]
    D --> E[Success]
    
    style A fill:#f9f,stroke:#333
    style E fill:#9f9,stroke:#333
{% end %}
