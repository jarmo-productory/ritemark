# SSG Frontmatter Formats Research

**Sprint**: 15b - Export Templates
**Research Date**: October 22, 2025
**Focus**: Static Site Generator frontmatter specifications for export templates
**Use Case**: Enable users to export RiteMark documents with proper frontmatter for Hugo, Jekyll, Next.js, and Gatsby

---

## 🎯 Executive Summary

This document provides comprehensive specifications for implementing SSG frontmatter export templates in RiteMark. Users will be able to export their markdown documents with platform-specific frontmatter that integrates seamlessly with their static site workflows.

**Key Findings**:
- **Hugo**: Supports TOML, YAML, JSON (YAML most common)
- **Jekyll**: YAML-only, strict parsing
- **Next.js/MDX**: YAML-based, flexible custom fields
- **Gatsby**: YAML-only, GraphQL-optimized structure

---

## 📋 Table of Contents

1. [Hugo Frontmatter Specification](#1-hugo-frontmatter-specification)
2. [Jekyll Frontmatter Specification](#2-jekyll-frontmatter-specification)
3. [Next.js/MDX Frontmatter Specification](#3-nextjsmdx-frontmatter-specification)
4. [Gatsby Frontmatter Specification](#4-gatsby-frontmatter-specification)
5. [TypeScript Interfaces](#5-typescript-interfaces)
6. [Template Generation Functions](#6-template-generation-functions)
7. [Real-World Examples](#7-real-world-examples)
8. [Implementation Recommendations](#8-implementation-recommendations)

---

## 1. Hugo Frontmatter Specification

### Format Support

Hugo supports **three frontmatter formats**:
- **YAML** (most popular): `---` delimiters
- **TOML**: `+++` delimiters
- **JSON**: `{` `}` delimiters

**Recommendation**: Use YAML for maximum compatibility and readability.

### Standard Fields

```yaml
---
title: "Document Title"
date: 2025-10-22T15:30:00-07:00  # ISO 8601 format
lastmod: 2025-10-22T16:00:00-07:00
draft: false
description: "Brief description for SEO"
slug: "custom-url-slug"
author: "Author Name"
tags: ["tag1", "tag2", "tag3"]
categories: ["category1", "category2"]
series: ["series-name"]
keywords: ["keyword1", "keyword2"]
weight: 10  # For ordering in lists
featured_image: "/images/featured.jpg"
toc: true  # Enable table of contents
---
```

### Content Organization Best Practices

**Directory Structure**:
```
content/
├── blog/
│   ├── _index.md          # Section page
│   └── post-1.md          # Individual posts
├── docs/
│   ├── _index.md
│   ├── getting-started.md
│   └── advanced/
│       ├── _index.md
│       └── configuration.md
```

**Section Variables** (`_index.md`):
```yaml
---
title: "Blog"
description: "Latest posts"
type: "blog"
layout: "list"
---
```

**Advanced Features**:
```yaml
---
# Taxonomies
tags: ["hugo", "static-sites"]
categories: ["tutorials"]
series: ["hugo-basics"]

# Custom parameters
params:
  author: "John Doe"
  github: "https://github.com/user"
  difficulty: "intermediate"
  time_to_read: "10 min"

# Build settings
outputs: ["html", "rss", "json"]
aliases: ["/old-url", "/another-old-url"]

# Menus
menu:
  main:
    name: "Documentation"
    weight: 20
---
```

### Date Format Requirements

Hugo requires **ISO 8601** format with timezone:
```yaml
date: 2025-10-22T15:30:00-07:00  # ✅ Correct
date: 2025-10-22                  # ⚠️  Works but no time
date: 10/22/2025                  # ❌ Invalid
```

### Hugo-Specific Features

**Page Resources** (for page bundles):
```yaml
---
title: "Blog Post with Images"
resources:
- src: "featured.jpg"
  name: "header"
  title: "Featured Image"
  params:
    credit: "Photo by User"
- src: "diagram.png"
  name: "diagram"
---
```

**Cascade** (apply settings to child pages):
```yaml
---
title: "Documentation Section"
cascade:
  type: "docs"
  layout: "single"
  toc: true
---
```

---

## 2. Jekyll Frontmatter Specification

### Format Support

Jekyll **only supports YAML** frontmatter:
```yaml
---
# YAML frontmatter here
---
```

**Critical**: Jekyll will fail to parse TOML or JSON frontmatter.

### Required Fields

Minimum viable frontmatter:
```yaml
---
layout: post
title: "Document Title"
date: 2025-10-22 15:30:00 -0700
---
```

### Standard Fields

```yaml
---
layout: post                    # Required: post, page, default
title: "Full Document Title"    # Required
date: 2025-10-22 15:30:00 -0700 # Required for posts
author: "Author Name"
categories: [blog, tutorials]   # Array format
tags: [jekyll, markdown]        # Array format
permalink: /blog/:year/:month/:title/
published: true                 # false = draft
excerpt: "Short description for listings"
---
```

### Permalink Structure

Jekyll supports **flexible permalink patterns**:

```yaml
# Built-in styles
permalink: pretty              # /:categories/:year/:month/:day/:title/
permalink: date                # /:categories/:year/:month/:day/:title.html
permalink: ordinal             # /:categories/:year/:y_day/:title.html
permalink: none                # /:categories/:title.html

# Custom patterns
permalink: /blog/:year/:month/:title/
permalink: /:categories/:title/
permalink: /posts/:slug/

# Available placeholders:
# :year, :month, :day, :i_month, :i_day
# :title, :slug, :categories, :y_day
```

### Category and Tag Conventions

**Arrays vs Strings**:
```yaml
# ✅ Recommended (YAML array)
categories: [web-development, tutorials]
tags: [jekyll, static-sites, markdown]

# ✅ Also valid (YAML list)
categories:
  - web-development
  - tutorials

# ⚠️  Deprecated (space-separated string)
categories: web-development tutorials
```

**Category Hierarchy** (affects URLs):
```yaml
---
categories: [tutorials, jekyll, beginner]
# URL: /tutorials/jekyll/beginner/2025/10/22/title/
---
```

### Layout Options

Common Jekyll layouts:
```yaml
layout: post      # Blog posts
layout: page      # Static pages
layout: default   # Base template
layout: home      # Homepage
layout: archive   # Archive/category pages
```

### Jekyll-Specific Features

**Custom Variables**:
```yaml
---
layout: post
title: "Tutorial"
author: "John Doe"
custom_css: "tutorial.css"
custom_js: "demo.js"
featured_image: "/assets/images/hero.jpg"
reading_time: "8 min"
difficulty: "intermediate"
---
```

**Collections** (for non-post content):
```yaml
# In _config.yml:
collections:
  tutorials:
    output: true
    permalink: /tutorials/:path/

# In frontmatter:
---
layout: tutorial
title: "Getting Started"
collection: tutorials
order: 1
---
```

---

## 3. Next.js/MDX Frontmatter Specification

### Format Support

Next.js MDX uses **YAML frontmatter**:
```yaml
---
# YAML frontmatter
---

# MDX content with React components
```

### Standard Fields

```yaml
---
title: "Document Title"
description: "SEO description"
date: "2025-10-22"
author: "Author Name"
tags: ["nextjs", "react", "mdx"]
image: "/images/featured.jpg"
published: true
---
```

### Integration with React Components

MDX allows **importing and using React components**:

```mdx
---
title: "Interactive Tutorial"
components: ["CodeBlock", "DemoWidget"]
---

import CodeBlock from '@/components/CodeBlock'
import DemoWidget from '@/components/DemoWidget'

# Interactive Demo

<CodeBlock language="javascript">
  const example = "Hello World";
</CodeBlock>

<DemoWidget title="Try it yourself" />
```

### Next.js-Specific Fields

**SEO and Open Graph**:
```yaml
---
title: "Page Title"
description: "Meta description"
openGraph:
  type: "article"
  title: "OG Title"
  description: "OG Description"
  images:
    - url: "/og-image.jpg"
      width: 1200
      height: 630
      alt: "OG Image"
twitter:
  card: "summary_large_image"
  site: "@username"
  creator: "@username"
---
```

**Route Metadata**:
```yaml
---
slug: "custom-url-slug"
path: "/blog/tutorials/getting-started"
layout: "blog-post"
sidebar: true
toc: true
---
```

### TypeScript Integration

Next.js projects often use **typed frontmatter**:

```typescript
// types/frontmatter.ts
export interface BlogPostFrontmatter {
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image?: string;
  published: boolean;
  readingTime?: string;
}
```

### Custom Metadata for App Router

Next.js 13+ App Router uses **metadata API**:

```yaml
---
# Frontmatter
title: "Blog Post"
description: "Description"

# Next.js metadata
metadata:
  robots: "index, follow"
  canonical: "https://example.com/blog/post"
  alternates:
    languages:
      en: "/en/blog/post"
      es: "/es/blog/post"
---
```

---

## 4. Gatsby Frontmatter Specification

### Format Support

Gatsby uses **YAML frontmatter** exclusively.

### Standard Fields

```yaml
---
title: "Document Title"
description: "Page description"
date: "2025-10-22"
author: "Author Name"
tags: ["gatsby", "react", "graphql"]
category: "tutorials"
image: "./featured.jpg"  # Relative path for gatsby-image
---
```

### GraphQL Query Patterns

Gatsby frontmatter is accessed via **GraphQL**:

```graphql
query BlogPostQuery {
  mdx(slug: { eq: $slug }) {
    frontmatter {
      title
      description
      date(formatString: "MMMM DD, YYYY")
      author
      tags
      category
      image {
        childImageSharp {
          gatsbyImageData(width: 800)
        }
      }
    }
    body
    excerpt
  }
}
```

### Metadata Structure for GraphQL Optimization

**Flat Structure** (recommended):
```yaml
---
title: "Blog Post"
description: "Description"
date: "2025-10-22"
author: "John Doe"
authorTwitter: "@johndoe"
authorImage: "./authors/john.jpg"
featuredImage: "./images/featured.jpg"
---
```

**Nested Structure** (use sparingly):
```yaml
---
title: "Blog Post"
seo:
  description: "SEO description"
  keywords: ["gatsby", "react"]
  ogImage: "./og-image.jpg"
author:
  name: "John Doe"
  twitter: "@johndoe"
  avatar: "./authors/john.jpg"
---
```

### Gatsby-Specific Features

**Image Processing** (gatsby-plugin-image):
```yaml
---
title: "Blog Post"
featuredImage: "./hero.jpg"        # Processed by Sharp
heroImageAlt: "Description"
thumbnail: "./thumbnail.jpg"
gallery:
  - "./image1.jpg"
  - "./image2.jpg"
  - "./image3.jpg"
---
```

**SEO Plugin Integration** (gatsby-plugin-react-helmet):
```yaml
---
title: "Page Title"
description: "Meta description"
keywords: ["keyword1", "keyword2"]
lang: "en"
meta:
  - name: "robots"
    content: "index, follow"
  - property: "og:type"
    content: "article"
---
```

**Sourcing from CMS** (Contentful/Sanity):
```yaml
---
# Standard fields
title: "Blog Post"
slug: "blog-post-slug"

# CMS-specific
contentfulId: "abc123"
updatedAt: "2025-10-22T10:30:00Z"
publishedAt: "2025-10-21T09:00:00Z"
---
```

---

## 5. TypeScript Interfaces

### Base Frontmatter Interface

```typescript
/**
 * Base frontmatter interface shared across all SSG platforms
 */
export interface BaseFrontmatter {
  title: string;
  description?: string;
  date?: string | Date;
  author?: string;
  tags?: string[];
  draft?: boolean;
}
```

### Hugo Frontmatter Interface

```typescript
/**
 * Hugo frontmatter with platform-specific fields
 * @see https://gohugo.io/content-management/front-matter/
 */
export interface HugoFrontmatter extends BaseFrontmatter {
  // Required
  title: string;
  date: string; // ISO 8601 format

  // Common optional
  lastmod?: string;
  draft?: boolean;
  description?: string;
  slug?: string;
  author?: string;
  tags?: string[];
  categories?: string[];
  series?: string[];
  keywords?: string[];

  // Organization
  weight?: number;
  featured_image?: string;
  toc?: boolean;

  // Advanced
  params?: Record<string, unknown>;
  outputs?: string[];
  aliases?: string[];
  menu?: {
    main?: {
      name: string;
      weight: number;
    };
  };

  // Resources (for page bundles)
  resources?: Array<{
    src: string;
    name: string;
    title?: string;
    params?: Record<string, unknown>;
  }>;

  // Cascade (for section pages)
  cascade?: Record<string, unknown>;
}
```

### Jekyll Frontmatter Interface

```typescript
/**
 * Jekyll frontmatter with strict YAML requirements
 * @see https://jekyllrb.com/docs/front-matter/
 */
export interface JekyllFrontmatter extends BaseFrontmatter {
  // Required
  layout: 'post' | 'page' | 'default' | 'home' | string;
  title: string;
  date?: string; // YYYY-MM-DD HH:MM:SS ±TTTT

  // Common optional
  author?: string;
  categories?: string[];
  tags?: string[];
  permalink?: string;
  published?: boolean;
  excerpt?: string;

  // Custom variables
  featured_image?: string;
  reading_time?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  custom_css?: string;
  custom_js?: string;

  // Collections
  collection?: string;
  order?: number;

  // Any custom fields
  [key: string]: unknown;
}
```

### Next.js/MDX Frontmatter Interface

```typescript
/**
 * Next.js MDX frontmatter with TypeScript support
 * @see https://nextjs.org/docs/app/building-your-application/configuring/mdx
 */
export interface NextMDXFrontmatter extends BaseFrontmatter {
  title: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  image?: string;
  published?: boolean;

  // SEO
  openGraph?: {
    type?: 'article' | 'website';
    title?: string;
    description?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
  };

  twitter?: {
    card?: 'summary' | 'summary_large_image';
    site?: string;
    creator?: string;
  };

  // Routing
  slug?: string;
  path?: string;
  layout?: string;
  sidebar?: boolean;
  toc?: boolean;

  // Components
  components?: string[];

  // App Router metadata
  metadata?: {
    robots?: string;
    canonical?: string;
    alternates?: {
      languages?: Record<string, string>;
    };
  };

  // Reading time (calculated)
  readingTime?: string;
}
```

### Gatsby Frontmatter Interface

```typescript
/**
 * Gatsby frontmatter optimized for GraphQL queries
 * @see https://www.gatsbyjs.com/docs/how-to/routing/adding-markdown-pages/
 */
export interface GatsbyFrontmatter extends BaseFrontmatter {
  title: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  category?: string;

  // Images (relative paths for gatsby-plugin-image)
  image?: string;
  featuredImage?: string;
  heroImageAlt?: string;
  thumbnail?: string;
  gallery?: string[];

  // Author info
  authorTwitter?: string;
  authorImage?: string;

  // SEO (gatsby-plugin-react-helmet)
  keywords?: string[];
  lang?: string;
  meta?: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;

  // CMS integration
  contentfulId?: string;
  updatedAt?: string;
  publishedAt?: string;

  // Custom fields
  [key: string]: unknown;
}
```

### Union Type for All Platforms

```typescript
/**
 * Union type representing any SSG frontmatter format
 */
export type SSGFrontmatter =
  | HugoFrontmatter
  | JekyllFrontmatter
  | NextMDXFrontmatter
  | GatsbyFrontmatter;

/**
 * SSG platform identifier
 */
export type SSGPlatform = 'hugo' | 'jekyll' | 'nextjs' | 'gatsby';
```

---

## 6. Template Generation Functions

### Base Template Generator

```typescript
import yaml from 'js-yaml';

/**
 * Generates frontmatter YAML string from object
 */
export function generateFrontmatter(
  data: Record<string, unknown>,
  format: 'yaml' | 'toml' | 'json' = 'yaml'
): string {
  switch (format) {
    case 'yaml':
      return `---\n${yaml.dump(data, { lineWidth: -1 })}---\n`;
    case 'toml':
      // Note: Would need TOML library
      throw new Error('TOML format requires @iarna/toml package');
    case 'json':
      return `{\n${JSON.stringify(data, null, 2)}\n}\n`;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
```

### Hugo Template Generator

```typescript
/**
 * Generates Hugo-compatible frontmatter
 */
export function generateHugoFrontmatter(
  title: string,
  content: string,
  options: Partial<HugoFrontmatter> = {}
): string {
  const now = new Date();
  const isoDate = now.toISOString();

  const frontmatter: HugoFrontmatter = {
    title,
    date: isoDate,
    lastmod: isoDate,
    draft: false,
    description: options.description || '',
    tags: options.tags || [],
    categories: options.categories || [],
    ...options,
  };

  const yamlFrontmatter = generateFrontmatter(frontmatter, 'yaml');
  return `${yamlFrontmatter}\n${content}`;
}

/**
 * Example usage
 */
const hugoDoc = generateHugoFrontmatter(
  'My Blog Post',
  '# Content here\n\nMarkdown content...',
  {
    description: 'A tutorial on Hugo',
    tags: ['hugo', 'static-sites'],
    categories: ['tutorials'],
    author: 'John Doe',
    toc: true,
  }
);
```

### Jekyll Template Generator

```typescript
/**
 * Generates Jekyll-compatible frontmatter
 */
export function generateJekyllFrontmatter(
  title: string,
  content: string,
  options: Partial<JekyllFrontmatter> = {}
): string {
  const now = new Date();

  // Jekyll date format: YYYY-MM-DD HH:MM:SS ±TTTT
  const dateStr = now.toISOString().slice(0, 19).replace('T', ' ');
  const timezone = now.toTimeString().match(/([+-]\d{4})/)?.[1] || '+0000';
  const jekyllDate = `${dateStr} ${timezone}`;

  const frontmatter: JekyllFrontmatter = {
    layout: options.layout || 'post',
    title,
    date: jekyllDate,
    categories: options.categories || [],
    tags: options.tags || [],
    published: options.published !== false,
    ...options,
  };

  const yamlFrontmatter = generateFrontmatter(frontmatter, 'yaml');
  return `${yamlFrontmatter}\n${content}`;
}

/**
 * Example usage
 */
const jekyllDoc = generateJekyllFrontmatter(
  'My Jekyll Post',
  '# Content here\n\nMarkdown content...',
  {
    layout: 'post',
    categories: ['blog', 'tutorials'],
    tags: ['jekyll', 'markdown'],
    permalink: '/blog/:year/:month/:title/',
    author: 'Jane Smith',
  }
);
```

### Next.js/MDX Template Generator

```typescript
/**
 * Generates Next.js MDX-compatible frontmatter
 */
export function generateNextMDXFrontmatter(
  title: string,
  content: string,
  options: Partial<NextMDXFrontmatter> = {}
): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  const frontmatter: NextMDXFrontmatter = {
    title,
    description: options.description || '',
    date: dateStr,
    author: options.author || '',
    tags: options.tags || [],
    published: options.published !== false,
    ...options,
  };

  const yamlFrontmatter = generateFrontmatter(frontmatter, 'yaml');
  return `${yamlFrontmatter}\n${content}`;
}

/**
 * Example with SEO metadata
 */
const nextDoc = generateNextMDXFrontmatter(
  'Next.js Tutorial',
  '# Getting Started\n\nContent here...',
  {
    description: 'Learn Next.js with this tutorial',
    tags: ['nextjs', 'react', 'typescript'],
    image: '/images/nextjs-tutorial.jpg',
    openGraph: {
      type: 'article',
      title: 'Next.js Tutorial - Complete Guide',
      description: 'Master Next.js in 2025',
      images: [
        {
          url: '/images/og-nextjs-tutorial.jpg',
          width: 1200,
          height: 630,
          alt: 'Next.js Tutorial',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@yoursite',
      creator: '@author',
    },
  }
);
```

### Gatsby Template Generator

```typescript
/**
 * Generates Gatsby-compatible frontmatter
 */
export function generateGatsbyFrontmatter(
  title: string,
  content: string,
  options: Partial<GatsbyFrontmatter> = {}
): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  const frontmatter: GatsbyFrontmatter = {
    title,
    description: options.description || '',
    date: dateStr,
    author: options.author || '',
    tags: options.tags || [],
    category: options.category || '',
    ...options,
  };

  const yamlFrontmatter = generateFrontmatter(frontmatter, 'yaml');
  return `${yamlFrontmatter}\n${content}`;
}

/**
 * Example with image processing
 */
const gatsbyDoc = generateGatsbyFrontmatter(
  'Gatsby Blog Post',
  '# My Post\n\nContent here...',
  {
    description: 'A comprehensive guide to Gatsby',
    tags: ['gatsby', 'react', 'graphql'],
    category: 'tutorials',
    featuredImage: './images/featured.jpg',
    heroImageAlt: 'Gatsby tutorial hero image',
    author: 'Alex Developer',
    authorTwitter: '@alexdev',
    authorImage: './authors/alex.jpg',
  }
);
```

### Unified Export Function

```typescript
/**
 * Unified export function for all SSG platforms
 */
export function exportToSSG(
  platform: SSGPlatform,
  title: string,
  content: string,
  options: Partial<SSGFrontmatter> = {}
): string {
  switch (platform) {
    case 'hugo':
      return generateHugoFrontmatter(title, content, options as Partial<HugoFrontmatter>);
    case 'jekyll':
      return generateJekyllFrontmatter(title, content, options as Partial<JekyllFrontmatter>);
    case 'nextjs':
      return generateNextMDXFrontmatter(title, content, options as Partial<NextMDXFrontmatter>);
    case 'gatsby':
      return generateGatsbyFrontmatter(title, content, options as Partial<GatsbyFrontmatter>);
    default:
      throw new Error(`Unsupported SSG platform: ${platform}`);
  }
}

/**
 * Example usage
 */
const markdown = exportToSSG('hugo', 'My Post', '# Content', {
  tags: ['tutorial'],
  categories: ['development'],
});
```

---

## 7. Real-World Examples

### Example 1: Hugo Blog Post

```yaml
---
title: "Building a Static Site with Hugo"
date: 2025-10-22T15:30:00-07:00
lastmod: 2025-10-22T16:00:00-07:00
draft: false
description: "Learn how to build a modern static website using Hugo static site generator"
slug: "building-static-site-hugo"
author: "Jane Developer"
tags: ["hugo", "static-sites", "web-development"]
categories: ["tutorials", "web-development"]
series: ["hugo-basics"]
keywords: ["hugo tutorial", "static site generator", "jamstack"]
weight: 10
featured_image: "/images/hugo-tutorial-hero.jpg"
toc: true
params:
  difficulty: "beginner"
  time_to_read: "15 min"
  github_repo: "https://github.com/user/hugo-tutorial"
menu:
  main:
    name: "Hugo Tutorial"
    weight: 30
---

# Building a Static Site with Hugo

Hugo is a fast and flexible static site generator...
```

### Example 2: Jekyll Blog Post

```yaml
---
layout: post
title: "Getting Started with Jekyll"
date: 2025-10-22 15:30:00 -0700
author: "John Blogger"
categories: [tutorials, jekyll]
tags: [jekyll, ruby, static-sites, markdown]
permalink: /blog/:year/:month/:title/
published: true
excerpt: "A comprehensive guide to building your first Jekyll site"
featured_image: "/assets/images/jekyll-getting-started.jpg"
reading_time: "12 min"
difficulty: "beginner"
custom_css: "tutorial.css"
---

# Getting Started with Jekyll

Jekyll is a simple, blog-aware, static site generator...
```

### Example 3: Next.js MDX Blog Post

```yaml
---
title: "Next.js 14 App Router Guide"
description: "Complete guide to the Next.js 14 App Router with TypeScript and MDX"
date: "2025-10-22"
author: "Alex Frontend"
tags: ["nextjs", "react", "typescript", "mdx"]
image: "/images/nextjs-14-guide.jpg"
published: true
slug: "nextjs-14-app-router-guide"
layout: "blog-post"
sidebar: true
toc: true
readingTime: "18 min"
openGraph:
  type: "article"
  title: "Next.js 14 App Router - Complete Guide"
  description: "Master the Next.js 14 App Router with this comprehensive tutorial"
  images:
    - url: "/images/og-nextjs-14.jpg"
      width: 1200
      height: 630
      alt: "Next.js 14 App Router Guide"
twitter:
  card: "summary_large_image"
  site: "@yoursite"
  creator: "@alexfrontend"
metadata:
  robots: "index, follow"
  canonical: "https://example.com/blog/nextjs-14-app-router-guide"
---

# Next.js 14 App Router Guide

The Next.js App Router introduces a new paradigm for building React applications...
```

### Example 4: Gatsby Blog Post

```yaml
---
title: "Gatsby Image Processing Guide"
description: "Learn how to optimize images in Gatsby using gatsby-plugin-image"
date: "2025-10-22"
author: "Sarah Developer"
authorTwitter: "@sarahdev"
authorImage: "./authors/sarah.jpg"
tags: ["gatsby", "react", "image-optimization", "performance"]
category: "tutorials"
featuredImage: "./images/gatsby-image-hero.jpg"
heroImageAlt: "Gatsby image processing tutorial hero"
thumbnail: "./images/gatsby-image-thumb.jpg"
gallery:
  - "./images/example-1.jpg"
  - "./images/example-2.jpg"
  - "./images/example-3.jpg"
keywords: ["gatsby images", "image optimization", "gatsby-plugin-image"]
lang: "en"
meta:
  - name: "robots"
    content: "index, follow"
  - property: "og:type"
    content: "article"
  - property: "og:image"
    content: "./images/og-gatsby-image.jpg"
---

# Gatsby Image Processing Guide

Gatsby's image processing capabilities are unmatched...
```

### Example 5: Hugo Documentation Page

```yaml
---
title: "API Configuration"
date: 2025-10-22T10:00:00Z
draft: false
description: "Complete API configuration reference"
weight: 20
toc: true
menu:
  docs:
    parent: "configuration"
    weight: 20
aliases: ["/docs/old-api-config", "/v1/api-config"]
params:
  version: "2.0"
  api_level: "advanced"
---

# API Configuration Reference

This document covers all configuration options...
```

### Example 6: Jekyll Collection Item

```yaml
---
layout: tutorial
title: "Advanced CSS Techniques"
collection: tutorials
order: 5
date: 2025-10-22
categories: [css, web-design]
tags: [css-grid, flexbox, animations]
difficulty: "advanced"
reading_time: "25 min"
prerequisites:
  - "Basic CSS knowledge"
  - "Understanding of HTML structure"
author: "Emily Designer"
custom_css: "code-highlighting.css"
custom_js: "interactive-demos.js"
---

# Advanced CSS Techniques

In this tutorial, we'll explore cutting-edge CSS features...
```

---

## 8. Implementation Recommendations

### 8.1 Template Selection UI

**User Flow**:
1. User clicks "Export" button in RiteMark
2. Modal/dialog shows SSG platform selection:
   - Hugo
   - Jekyll
   - Next.js/MDX
   - Gatsby
   - Plain Markdown (no frontmatter)
3. User selects platform
4. Optional: Configure frontmatter fields via form
5. Download/copy markdown with frontmatter

**UI Components**:
```typescript
// components/ExportDialog.tsx
interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentContent: string;
}

export function ExportDialog({ isOpen, onClose, documentTitle, documentContent }: ExportDialogProps) {
  const [platform, setPlatform] = useState<SSGPlatform>('hugo');
  const [frontmatterOptions, setFrontmatterOptions] = useState<Partial<SSGFrontmatter>>({});

  const handleExport = () => {
    const exported = exportToSSG(platform, documentTitle, documentContent, frontmatterOptions);
    downloadMarkdownFile(exported, `${documentTitle}.md`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export to Static Site Generator</DialogTitle>
        </DialogHeader>

        <PlatformSelector value={platform} onChange={setPlatform} />
        <FrontmatterForm platform={platform} options={frontmatterOptions} onChange={setFrontmatterOptions} />

        <DialogFooter>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 8.2 Frontmatter Form Builder

**Dynamic Form Based on Platform**:
```typescript
// components/FrontmatterForm.tsx
export function FrontmatterForm({ platform, options, onChange }: FrontmatterFormProps) {
  const fields = getFrontmatterFields(platform);

  return (
    <div className="space-y-4">
      {fields.map(field => (
        <FormField key={field.name} field={field} value={options[field.name]} onChange={onChange} />
      ))}
    </div>
  );
}

function getFrontmatterFields(platform: SSGPlatform): FieldDefinition[] {
  switch (platform) {
    case 'hugo':
      return [
        { name: 'description', type: 'text', label: 'Description', placeholder: 'SEO description' },
        { name: 'tags', type: 'tags', label: 'Tags' },
        { name: 'categories', type: 'tags', label: 'Categories' },
        { name: 'draft', type: 'checkbox', label: 'Draft' },
        { name: 'toc', type: 'checkbox', label: 'Table of Contents' },
      ];
    case 'jekyll':
      return [
        { name: 'layout', type: 'select', label: 'Layout', options: ['post', 'page', 'default'] },
        { name: 'categories', type: 'tags', label: 'Categories' },
        { name: 'tags', type: 'tags', label: 'Tags' },
        { name: 'permalink', type: 'text', label: 'Permalink', placeholder: '/blog/:year/:month/:title/' },
      ];
    case 'nextjs':
      return [
        { name: 'description', type: 'text', label: 'Description' },
        { name: 'tags', type: 'tags', label: 'Tags' },
        { name: 'published', type: 'checkbox', label: 'Published' },
        { name: 'slug', type: 'text', label: 'URL Slug' },
      ];
    case 'gatsby':
      return [
        { name: 'description', type: 'text', label: 'Description' },
        { name: 'tags', type: 'tags', label: 'Tags' },
        { name: 'category', type: 'text', label: 'Category' },
      ];
  }
}
```

### 8.3 Smart Defaults

**Auto-populate frontmatter from document**:
```typescript
export function generateSmartDefaults(
  documentTitle: string,
  documentContent: string
): Partial<SSGFrontmatter> {
  // Extract first paragraph as description
  const descriptionMatch = documentContent.match(/^#.*\n\n(.+)/);
  const description = descriptionMatch?.[1].slice(0, 160) || '';

  // Auto-generate tags from headings
  const headings = documentContent.match(/^##\s+(.+)$/gm) || [];
  const tags = headings
    .map(h => h.replace('## ', '').toLowerCase())
    .slice(0, 5);

  return {
    title: documentTitle,
    description,
    tags,
    date: new Date().toISOString(),
    author: 'RiteMark User', // Could be pulled from user profile
  };
}
```

### 8.4 Template Presets

**Pre-configured templates for common use cases**:
```typescript
export const EXPORT_PRESETS: Record<string, Partial<SSGFrontmatter>> = {
  'hugo-blog-post': {
    draft: false,
    toc: true,
    categories: ['blog'],
  },
  'hugo-documentation': {
    draft: false,
    toc: true,
    weight: 10,
  },
  'jekyll-blog-post': {
    layout: 'post',
    published: true,
    permalink: '/blog/:year/:month/:title/',
  },
  'jekyll-tutorial': {
    layout: 'tutorial',
    published: true,
    reading_time: '10 min',
  },
  'nextjs-article': {
    published: true,
    sidebar: true,
    toc: true,
  },
  'gatsby-blog': {
    category: 'blog',
  },
};
```

### 8.5 Validation

**Validate frontmatter before export**:
```typescript
export function validateFrontmatter(
  platform: SSGPlatform,
  frontmatter: Partial<SSGFrontmatter>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (platform) {
    case 'hugo':
      if (!frontmatter.title) errors.push('Title is required');
      if (!frontmatter.date) errors.push('Date is required');
      break;
    case 'jekyll':
      if (!frontmatter.title) errors.push('Title is required');
      if (!(frontmatter as JekyllFrontmatter).layout) errors.push('Layout is required');
      break;
    case 'nextjs':
      if (!frontmatter.title) errors.push('Title is required');
      break;
    case 'gatsby':
      if (!frontmatter.title) errors.push('Title is required');
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 8.6 Download Helper

```typescript
/**
 * Downloads markdown file with frontmatter
 */
export function downloadMarkdownFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### 8.7 Copy to Clipboard

```typescript
/**
 * Copies markdown with frontmatter to clipboard
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
```

---

## 📊 Implementation Priority

### Phase 1: Core Functionality (Week 1)
1. ✅ Implement TypeScript interfaces
2. ✅ Create template generation functions
3. ✅ Build Hugo export (most popular)
4. ✅ Build Jekyll export (second most popular)

### Phase 2: Advanced Features (Week 2)
5. ⏳ Add Next.js/MDX support
6. ⏳ Add Gatsby support
7. ⏳ Build export dialog UI
8. ⏳ Implement smart defaults

### Phase 3: Polish (Week 3)
9. ⏳ Add template presets
10. ⏳ Implement validation
11. ⏳ Add copy-to-clipboard
12. ⏳ User testing and refinement

---

## 🔗 References

### Official Documentation
- **Hugo**: https://gohugo.io/content-management/front-matter/
- **Jekyll**: https://jekyllrb.com/docs/front-matter/
- **Next.js**: https://nextjs.org/docs/app/building-your-application/configuring/mdx
- **Gatsby**: https://www.gatsbyjs.com/docs/how-to/routing/adding-markdown-pages/

### NPM Packages
- `js-yaml`: YAML parsing/generation (already in dependencies)
- `@iarna/toml`: TOML support (optional for Hugo)
- `gray-matter`: Frontmatter parser (optional for validation)

### Community Resources
- Hugo Themes: https://themes.gohugo.io/ (frontmatter examples)
- Jekyll Themes: http://jekyllthemes.org/ (frontmatter patterns)
- Awesome Next.js: https://github.com/unicodeveloper/awesome-nextjs
- Gatsby Starters: https://www.gatsbyjs.com/starters/

---

## ✅ Next Steps

1. **Review this research** with development team
2. **Prioritize platforms** (suggest Hugo → Jekyll → Next.js → Gatsby)
3. **Design UI mockups** for export dialog
4. **Implement TypeScript interfaces** in codebase
5. **Build template generation functions**
6. **Create export dialog component**
7. **User testing** with target SSG users

---

**Research Completed**: October 22, 2025
**Researcher**: Claude (Research Agent)
**Document Version**: 1.0
**Sprint**: 15b - Export Templates
