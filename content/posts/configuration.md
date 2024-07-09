+++
title = "Configuration"
date = "2024-07-09"

[taxonomies]
tags=["blog"]
+++

# Configuration

## Table of Contents (`toc`)

Enables or disables the table of contents for posts.

- Type: Boolean
- Default: true
- Usage: `toc = true`

When enabled, a table of contents will be generated for posts, making it easier for readers to navigate through longer articles.

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

## Theme Mode (`theme`)

Sets the color theme for your blog.

- Type: String
- Options: "light", "dark", "auto", "toggle"
- Default: "toggle"
- Usage: `theme = "toggle"`

The "toggle" option allows users to switch between light and dark modes, while "auto" typically follows the user's system preferences.

## Comments (`comment`)

Enables or disables the comment system for posts.

- Type: Boolean
- Default: false
- Usage: `comment = false`

When enabled, this allows readers to leave comments on your blog posts.

## Fancy Code Styling (`fancy_code`)

Enables enhanced styling for code blocks.

- Type: Boolean
- Default: true
- Usage: `fancy_code = true`

This option applies additional styling to make code blocks more visually appealing and easier to read.

## Dynamic Notes (`dynamic_note`)

Allows for the creation of togglable note sections in your content.

- Type: Boolean
- Default: true
- Usage: `dynamic_note = true`

When enabled, you can create expandable/collapsible note sections in your blog posts.

## Header Anchor Links (`h_anchor_link`)

Adds anchor links to headers for easy referencing.

- Type: Boolean
- Default: true
- Usage: `h_anchor_link = true`

This feature adds clickable links next to headers, allowing readers to easily share or bookmark specific sections of your posts.

## Menu

Defines the navigation menu items for your blog.

- Type: Array of objects
- Usage:
  ```toml
  menu = [
      { name = "/posts", url = "/posts", weight = 1 },
      { name = "/projects", url = "/projects", weight = 2 },
      { name = "/about", url = "/about", weight = 3 },
      { name = "/tags", url = "/tags", weight = 4 },
  ]
