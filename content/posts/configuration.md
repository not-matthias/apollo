+++
title = "Configuring Apollo"
date = "2024-07-09"

[taxonomies]
tags=["documentation"]

[extra]
repo_view = true
comment = true
+++

# Site Configuration

## Search (`build_search_index`)

Enables or disables the search functionality for your blog.

- Type: Boolean
- Default: false
- Usage: `build_search_index = false`

When enabled, a search index will be generated for your blog, allowing visitors to search for specific content.
Additionally, a search button will be displayed in the navigation bar.

Configure the search like this:
```toml
build_search_index = true

[search]
include_title = true
include_description = true
include_path = true
include_content = true
index_format = "elasticlunr_json"
```

## Theme Mode (`theme`)

Sets the color theme for your blog.

- Type: String
- Options: "light", "dark", "auto", "toggle"
- Default: "toggle"
- Usage: `theme = "toggle"`

The "toggle" option allows users to switch between light and dark modes, while "auto" typically follows the user's system preferences.

## Menu

Defines the navigation menu items for your blog.

- Type: Array of objects
- Default: []
- Usage:
  ```toml
  menu = [
      { name = "/posts", url = "/posts", weight = 1 },
      { name = "/projects", url = "/projects", weight = 2 },
      { name = "/about", url = "/about", weight = 3 },
      { name = "/tags", url = "/tags", weight = 4 },
  ]
  ```

## Logo

Defines the site logo image file.

- Type: String
- Usage:
  ```toml
  logo = "site_logo.svg"
  ```

## Socials

Defines the social media links.

- Type: Array of objects
- Default: []
- Usage:
  ```toml
  socials = [
    { name = "twitter", url = "https://twitter.com/not_matthias", icon = "twitter" },
    { name = "github", url = "https://github.com/not-matthias/", icon = "github" },
  ]
  ```

## Table of Contents (`toc`)

Enables or disables the table of contents for posts.

- Type: Boolean
- Default: true
- Usage: `toc = true`

When enabled, a table of contents will be generated for posts, making it easier for readers to navigate through longer articles.

Note: This feature adds additional JavaScript to your site.

## CDN Usage (`use_cdn`)

Determines whether to use a Content Delivery Network (CDN) for assets.

- Type: Boolean
- Default: false
- Usage: `use_cdn = false`

When set to true, the theme will attempt to load assets from a CDN, which can improve loading times for visitors from different geographic locations.

## Favicon (`favicon`)

Specifies the path to the favicon image for your blog.

- Type: String
- Default: "/icon/favicon.png"
- Usage: `favicon = "/icon/favicon.png"`

This sets the small icon that appears in the browser tab for your website.

## Custom Stylesheets (`stylesheets`)

Allows you to add custom stylesheets to your blog.

- Type: Array of files located in the `static` directory
- Default: []
- Usage:
  ```toml
  stylesheets = [
    "custom.css",           # static/custom.css
    "/css/another.css"      # static/css/another.css
  ]
  ```

## Fancy Code Styling (`fancy_code`)

Enables enhanced styling for code blocks.

- Type: Boolean
- Default: true
- Usage: `fancy_code = true`

This option adds the language label and a copy button.

## Dynamic Notes (`dynamic_note`)

Allows for the creation of togglable note sections in your content.

- Type: Boolean
- Default: true
- Usage: `dynamic_note = true`

When enabled, you can create expandable/collapsible note sections in your blog posts.

## Anchor Links

You can add anchor links by adding the following to your `_index.md`:
```toml
insert_anchor_links = "heading"
```

## Analytics

Enable or disable analytics tracking:

```toml
[extra.analytics]
enabled = false
```

After enabling analytics, configure GoatCounter or Umami.

### GoatCounter

Configure GoatCounter analytics:

```toml
[extra.analytics.goatcounter]
user = "your_user"           # Your GoatCounter username
host = "example.com"         # Optional: Custom host
```

### Umami Analytics

Configure Umami analytics:

```toml
[extra.analytics.umami]
website_id = "43929cd1-1e83...."                    # Your Umami website ID
host_url = "https://stats.mywebsite.com"            # Optional: Custom host URL
```


---


# Page configuration

## Source code (`repo_view`)

Do you want to link to the source code of your blog post? You can turn on the `repo_view` inside the `[extra]` section of your blog post.

```toml
[extra]
repo_view = true
repo_url = "https://github.com/not-matthias/apollo/tree/main/content"   # Alternatively add the repo here
```

The `repo_url` can be set in the `[extra]` section or in your `config.toml`.

## Comments (`comment`)

Enables or disables the comment system for posts.

- Type: Boolean
- Default: false
- Usage: `comment = false`

After making `comment = true` in `[extra]` section of you post, save your script from [Giscus](https://giscus.app) to `templates/_giscus_script.html`.
When enabled, this allows readers to leave comments on your blog posts. This feature has to be set for each individual post and is not supported at higher levels.

Example configuration in [content/posts/configuration.md](https://github.com/not-matthias/apollo/blob/main/content/posts/configuration.md):
```toml
+++
title = "Configuring Apollo"

[extra]
comment = true
+++
```

Comments via [utterances](https://utteranc.es) can be configured in `template/_giscus_script.html` like this:
```html
<script src="https://utteranc.es/client.js"
        repo="YOUR_NAME/YOUR_REPO"
        issue-term="pathname"
        theme="github-light"
        crossorigin="anonymous"
        async>
</script>
```
