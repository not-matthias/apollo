+++
template = "homepage.html"
+++

<style>
.homepage-hero {
    text-align: center;
    padding: 2rem 0;
}

.homepage-hero-title {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.homepage-hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 1rem;

</style>

<div class="homepage-hero">
    <h1 class="homepage-hero-title">Apollo</h1>
    <p class="homepage-hero-subtitle">A modern and minimalistic blog theme powered by Zola.</p>
</div>

# Features

- [Light, dark, and auto themes](@/posts/configuration.md#theme-mode-theme)
- [Projects page](@/projects/_index.md)
- [Talks page](https://not-matthias.github.io/talks/)
- [Analytics (GoatCounter, Umami)](@/posts/configuration.md#analytics)
- [Social media links](@/posts/configuration.md#socials)
- [MathJax rendering](@/posts/math-symbol.md)
- [Taxonomies](/apollo/tags)
- [Custom homepage](@/posts/custom-homepage.md)
- [Comments](@/posts/configuration.md#comments-comment)
- [Search functionality](@/posts/configuration.md#search-build-search-index)
- [Characters](@/posts/configuration.md#character-shortcodes)

Checkout all the [options you can configure](@/posts/configuration.md) and the [example pages](@/posts/_index.md).

# Quick Start

1.  **Add the theme as a submodule:**
    ```bash
    git submodule add https://github.com/not-matthias/apollo themes/apollo
    ```
2.  **Configure your `config.toml`:**
    Set `theme = "apollo"` and add your site's configuration.
3.  **Start the Zola server:**
    ```bash
    zola serve
    ```
