# advanced-seo-plugin

A comprehensive SEO plugin for [Payload CMS](https://payloadcms.com) v3 that injects a `meta` sidebar group into configured collections, provides a site-wide `global-seo` global for defaults, and exports composable utilities for title/URL generation, hreflang alternates, OG image generation, and JSON-LD structured data.

## Features

- **Meta sidebar group** — title, canonical URL, image, description, noindex/nofollow, hreflang alternates, and JSON-LD per document
- **Global SEO defaults** — site name, default title/description/image, Twitter handle, site-wide robots directive
- **Auto-generate meta title & URL** on save (skips if editor has already set a value)
- **Auto-generate hreflang alternates** on read (respects a global toggle; skips if manual alternates exist)
- **OG image generation** — generate and save an image to your media collection on publish
- **JSON-LD template builders** — `webPageJsonLd`, `articleJsonLd`, `productJsonLd`, `organizationJsonLd`, `breadcrumbJsonLd`, and `buildJsonLd`
- **`resolveMeta`** helper — resolve final title/description/image/noindex/nofollow/alternates/jsonLd from a document and global defaults
- **`toNextMetadata`** helper — build a complete Next.js `Metadata` object in one call
- **Character-count overview** and **SERP preview** UI components in the admin sidebar
- Fully typed — all config options and return types are exported

## Installation

```bash
pnpm add advanced-seo-plugin
# or
npm install advanced-seo-plugin
```

## Quick start

```ts
// payload.config.ts
import { advancedSeoPlugin } from 'advanced-seo-plugin'
import { buildConfig } from 'payload'

export default buildConfig({
  plugins: [
    advancedSeoPlugin({
      collections: {
        posts: true,
        pages: true,
      },
      generateTitle: ({ data }) => `${data.title} | My Site`,
      generateURL: ({ data }) => `https://example.com/posts/${data.slug}`,
    }),
  ],
})
```

This adds a **SEO** sidebar group to the `posts` and `pages` collections with fields for title, canonical URL, image, description, hreflang alternates, and JSON-LD.

## Plugin options

| Option | Type | Description |
|---|---|---|
| `collections` | `Partial<Record<CollectionSlug, true>>` | Collections to inject the meta group into |
| `disabled` | `boolean` | Disable the plugin without removing DB schema (useful for migrations) |
| `generateTitle` | `(args) => string \| null \| Promise<...>` | Auto-populate `meta.title` on save when the field is empty |
| `generateURL` | `(args) => string \| null \| Promise<...>` | Auto-populate `meta.url` on save when the field is empty |
| `generateAlternateURL` | `(args) => string \| null \| Promise<...>` | Build a URL for each locale when auto-generating hreflang alternates |
| `generateOgImage` | `(args) => Buffer \| null \| Promise<...>` | Generate an OG image (PNG/JPEG) when a document has no `meta.image` |
| `locales` | `string[]` | BCP 47 locale codes used for auto-alternates (e.g. `['en', 'fr', 'de']`) |
| `mediaCollection` | `string[]` | Media collection slug(s) for the image picker (default: `['media']`) |

### `generateTitle`

Called on `beforeChange` for every configured collection. Only runs if `meta.title` is currently empty — the editor's value always wins.

```ts
advancedSeoPlugin({
  collections: { posts: true },
  generateTitle: ({ collectionSlug, data, req }) =>
    `${data.title} | My Site`,
})
```

### `generateURL`

Called on `beforeChange` alongside `generateTitle` (in parallel). Only runs if `meta.url` is currently empty.

```ts
advancedSeoPlugin({
  collections: { posts: true },
  generateURL: ({ data }) =>
    `https://example.com/blog/${data.slug}`,
})
```

### `generateAlternateURL`

Called on `afterRead` once per locale per document. The hook only runs when:

1. The `global-seo` global has `autoGenerateAlternates` enabled
2. The document has no manually entered alternates
3. `generateAlternateURL` is configured and `locales` is non-empty

Return `null` to skip a locale.

```ts
advancedSeoPlugin({
  collections: { posts: true },
  locales: ['en', 'fr', 'de'],
  generateAlternateURL: ({ collectionSlug, doc, locale }) =>
    `https://example.com/${locale}/blog/${doc.slug}`,
})
```

### `generateOgImage`

Called on `afterChange` when the document has no `meta.image` set and the `global-seo` global has `enableOgGenerator` enabled. Return a `Buffer` (PNG or JPEG) — the plugin saves it to your media collection and writes the media ID back to `meta.image`.

```ts
advancedSeoPlugin({
  collections: { posts: true },
  generateOgImage: async ({ collectionSlug, doc }) => {
    // e.g. use @vercel/og or puppeteer to render a Buffer
    return renderOgImageBuffer(doc)
  },
})
```

## `toNextMetadata`

Builds a complete Next.js-compatible `Metadata` object from a document and optional global defaults. This is the recommended way to wire SEO into a Next.js App Router project.

```ts
import { toNextMetadata } from 'advanced-seo-plugin'
// or from the dedicated subpath:
import { toNextMetadata } from 'advanced-seo-plugin/next'

// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const doc = await payload.findByID({ collection: 'posts', id: params.id })
  const globals = await payload.findGlobal({ slug: 'global-seo' })
  return toNextMetadata(doc, globals)
}
```

The return type is structurally compatible with Next.js `Metadata` — no type cast needed.

**Options** (third argument):

| Option | Type | Default | Description |
|---|---|---|---|
| `openGraphType` | `'website' \| 'article' \| 'product'` | `'website'` | Sets `og:type` |
| `baseUrl` | `string` | — | Available for future use |

**What gets populated:**

| Key | Source |
|---|---|
| `title` | Resolved meta title (omitted when empty) |
| `description` | Resolved meta description (omitted when empty) |
| `robots` | Per-doc `noindex`/`nofollow` flags → global `robots` directive → omitted |
| `alternates.canonical` | `meta.url` |
| `alternates.languages` | `meta.alternates` array → `{ [locale]: url }` |
| `openGraph` | title, description, images, type |
| `twitter` | card (`summary_large_image`), site (from `twitterHandle`), title, description, images |

**Robots precedence:** per-document `noindex`/`nofollow` checkboxes take priority over the global `robots` directive. The global directive is only used when neither checkbox is set — useful for blocking an entire staging environment with a single toggle.

## `resolveMeta`

Lower-level helper. Returns the raw resolved values so you can build your own head tags.

```ts
import { resolveMeta } from 'advanced-seo-plugin'

const { title, description, image, noindex, nofollow, url, alternates, jsonLd } = resolveMeta(
  doc,
  { globals: globalSeoDoc },
)
```

Resolution order:

| Field | Priority |
|---|---|
| `title` | `meta.title` → `globals.defaultTitle` → `doc.title` → `''` |
| `description` | `meta.description` → `globals.defaultDescription` → `doc.description` → `''` |
| `image` | `meta.image` → `globals.defaultImage` → `null` |
| `url` | `meta.url` → `''` |
| `noindex` | `meta.noindex` → `false` |
| `nofollow` | `meta.nofollow` → `false` |
| `alternates` | `meta.alternates` (auto-generated alternates are merged by the `afterRead` hook before this is called) |
| `jsonLd` | `meta.jsonLd` → `null` |

The `image` field always resolves to a URL string (or `null`), whether the source value is an uploaded media object or a plain string.

## JSON-LD builders

All builders are tree-shakeable and exported from the main entry point.

```ts
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildJsonLd,
  organizationJsonLd,
  productJsonLd,
  webPageJsonLd,
} from 'advanced-seo-plugin'
```

### `webPageJsonLd(args?)`

```ts
const ld = webPageJsonLd({
  name: 'Home',
  url: 'https://example.com',
  description: 'Welcome to my site',
  datePublished: '2024-01-01',
})
```

### `articleJsonLd(args?)`

```ts
const ld = articleJsonLd({
  headline: 'My article',
  url: 'https://example.com/blog/my-article',
  author: 'Jane Smith',              // or { name: 'Jane Smith', url: '...' }
  publisher: {
    name: 'Acme Corp',
    logo: 'https://example.com/logo.png',
  },
  datePublished: '2024-01-01',
})
```

### `productJsonLd(args?)`

```ts
const ld = productJsonLd({
  name: 'My Product',
  brand: 'Acme',
  offers: {
    price: 9.99,
    currency: 'USD',
    availability: 'InStock',
    url: 'https://example.com/products/my-product',
  },
})
```

### `organizationJsonLd(args?)`

```ts
const ld = organizationJsonLd({
  name: 'Acme Corp',
  url: 'https://example.com',
  logo: 'https://example.com/logo.png',
  sameAs: ['https://twitter.com/acme', 'https://linkedin.com/acme'],
})
```

### `breadcrumbJsonLd(items)`

```ts
const ld = breadcrumbJsonLd([
  { id: 'https://example.com', name: 'Home' },
  { id: 'https://example.com/blog', name: 'Blog' },
  { id: 'https://example.com/blog/my-article', name: 'My Article' },
])
```

### `buildJsonLd(base, overrides?)`

Merge a base template with doc-specific values. `@context` and `@type` are always preserved from the base.

```ts
const base = articleJsonLd({ headline: 'Default headline' })
const merged = buildJsonLd(base, {
  headline: doc.meta.title,
  url: doc.meta.url,
  datePublished: doc.publishedAt,
})
```

## Field factories

All fields used in the meta group are individually exported so you can compose your own layouts.

```ts
import {
  AlternatesField,
  MetaDescriptionField,
  MetaImageField,
  MetaNofollowField,
  MetaNoindexField,
  MetaTitleField,
  MetaUrlField,
  OverviewField,
  PreviewField,
  structuredDataRow,
} from 'advanced-seo-plugin'
```

| Export | Type | Description |
|---|---|---|
| `OverviewField(args)` | UI field | Character-count overview (title ≤ 60, description ≤ 160) |
| `MetaTitleField(args)` | Text field | `meta.title` |
| `MetaUrlField(args)` | Text field | `meta.url` (canonical URL) |
| `MetaImageField(args)` | Upload field | `meta.image` |
| `MetaDescriptionField(args)` | Textarea field | `meta.description` |
| `MetaNoindexField(args)` | Checkbox field | `meta.noindex` — block search engine indexing |
| `MetaNofollowField(args)` | Checkbox field | `meta.nofollow` — block link following |
| `AlternatesField(args)` | Array field | `meta.alternates` — locale + URL pairs |
| `structuredDataRow` | Row field | `meta.jsonLd` with inline JSON editor |
| `PreviewField(args)` | UI field | Google SERP-style preview |

## Global SEO

The plugin automatically registers a `global-seo` global in your Payload config. Find it in the admin panel under **Globals → Global SEO**. It provides:

- **Site name** and **Twitter handle**
- **Site-wide robots directive** — set e.g. `noindex, nofollow` to block all pages (great for staging); overridden per-document by the noindex/nofollow checkboxes
- **Default title**, **default description**, **default image** — used as fallbacks in `resolveMeta`
- **Auto-generate alternates** toggle — enables the `afterRead` alternate generation hook
- **Enable OG image generator** toggle — enables the `afterChange` OG image hook
- **JSON-LD templates** — named JSON-LD presets you can reference in your own code

## Development

```bash
# Start the dev MongoDB
pnpm dev:db:up

# Start the Next.js dev server (the dev/ directory is a full Payload app)
pnpm dev

# Run unit tests
pnpm test:int

# Build the plugin
pnpm build
```

## License

MIT
