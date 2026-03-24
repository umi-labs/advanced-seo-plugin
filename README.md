# advanced-seo-plugin

A comprehensive SEO plugin for [Payload CMS](https://payloadcms.com) v3. It injects a `meta` sidebar group into configured collections, registers a `global-seo` global for site defaults, and exports composable utilities for title/URL generation, hreflang alternates, OG image generation, and JSON-LD structured data.

This README documents the plugin features and shows how to use them in common scenarios (Payload config, Next.js App Router, and small helper examples).

## What this plugin provides

- Meta sidebar group (per-document)
  - `meta.title`, `meta.url` (canonical), `meta.image`, `meta.description`, `meta.noindex`, `meta.nofollow`, `meta.alternates` (hreflang), `meta.jsonLd`
- `global-seo` Global for site defaults and toggles
- Auto-generation hooks
  - `generateTitle` and `generateURL` (run on save / beforeChange)
  - `generateAlternateURL` (run on read to auto-fill hreflang alternates)
  - `generateOgImage` (run on change/publish to create an OG image when missing)
- Helpers and builders
  - `resolveMeta` — resolve final title/description/image/url/robots/alternates/jsonLd
  - `toNextMetadata` — build Next.js `Metadata` objects from docs/globals
  - JSON-LD builders: `webPageJsonLd`, `articleJsonLd`, `productJsonLd`, `organizationJsonLd`, `breadcrumbJsonLd`, `buildJsonLd`
  - Field factories / UI components: overview, SERP preview, upload field, alternates, etc.
- Fully typed (TypeScript) exports for config and return values

## Installation

```bash
pnpm add @foundrykit/advanced-seo-plugin
# or
npm install @foundrykit/advanced-seo-plugin
```

## Quick start (Payload config)

Add the plugin to your `payload.config.ts` and enable it for the collections you want to enhance.

```ts
// payload.config.ts
import { buildConfig } from 'payload'
import { advancedSeoPlugin } from '@foundrykit/advanced-seo-plugin'

export default buildConfig({
  plugins: [
    advancedSeoPlugin({
      collections: { posts: true, pages: true },
      // optional generators shown below
    }),
  ],
})
```

After registering the plugin you will see a new `SEO` (meta) group in the admin sidebar for each configured collection. Editors can set values manually or rely on the auto-generation hooks.

## Plugin options and usage

All options are exported typesafe. The most-used options are shown below with examples.

- `collections: Partial<Record<CollectionSlug, true>>` — which collections receive the meta group
- `disabled?: boolean` — set to `true` to disable behaviour while preserving schema
- `locales?: string[]` — BCP47 locale codes used by `generateAlternateURL`
- `mediaCollection?: string[]` — media collection slug(s) used by the image picker (default `['media']`)

Hook generators (each may return the expected value or `null` to skip):

- `generateTitle(args) => string | null | Promise<string | null>`
  - Runs on `beforeChange` when `meta.title` is empty. Use to apply site title templates.

Example:

```ts
advancedSeoPlugin({
  collections: { posts: true },
  generateTitle: ({ data }) => `${data.title} | My Site`,
})
```

- `generateURL(args) => string | null | Promise<string | null>`
  - Runs on `beforeChange` when `meta.url` is empty. Useful for canonical URL construction.

Example:

```ts
advancedSeoPlugin({
  collections: { posts: true },
  generateURL: ({ data }) => `https://example.com/blog/${data.slug}`,
})
```

- `generateAlternateURL({ collectionSlug, doc, locale }) => string | null | Promise<string | null>`
  - Runs on `afterRead` once per configured locale when the `global-seo` global has `autoGenerateAlternates` enabled and the doc has no manual alternates entered.
  - Return `null` to skip creating an alternate for a specific locale.

Example:

```ts
advancedSeoPlugin({
  collections: { posts: true },
  locales: ['en', 'fr', 'de'],
  generateAlternateURL: ({ doc, locale }) => `https://example.com/${locale}/blog/${doc.slug}`,
})
```

- `generateOgImage({ collectionSlug, doc }) => Buffer | null | Promise<Buffer | null>`
  - Runs on `afterChange` only when the document has no `meta.image` and the `global-seo` global has `enableOgGenerator` enabled.
  - Return a PNG/JPEG buffer; the plugin saves it to the configured media collection and writes the media id back to `meta.image`.

Example using a hypothetical renderer:

```ts
advancedSeoPlugin({
  collections: { posts: true },
  generateOgImage: async ({ doc }) => {
    // renderOgImageBuffer should return a Buffer (PNG/JPEG)
    return await renderOgImageBuffer({ title: doc.meta?.title ?? doc.title })
  },
})
```

Notes:

- Generators only run when a field is empty — manual editor input always wins.
- `generateTitle` and `generateURL` run in parallel on `beforeChange`.

## Global SEO (admin global)

The plugin registers a `global-seo` global. Open **Admin → Globals → Global SEO** to configure:

- Site name and Twitter handle
- Default title, description, and default image
- Site-wide `robots` directive (e.g. `noindex, nofollow`) — used when per-doc checkboxes are not set
- `autoGenerateAlternates` toggle — enables `generateAlternateURL` behaviour
- `enableOgGenerator` toggle — enables `generateOgImage` behaviour
- JSON-LD templates you can reference from code

Use `payload.findGlobal({ slug: 'global-seo' })` to read global values in server code.

## Helpers

- `resolveMeta(doc, { globals? })`
  - Returns resolved values: `{ title, description, image, url, noindex, nofollow, alternates, jsonLd }`.
  - Resolution order (highest → lowest):
    - `title`: `meta.title` → `globals.defaultTitle` → `doc.title` → `''`
    - `description`: `meta.description` → `globals.defaultDescription` → `doc.description` → `''`
    - `image`: `meta.image` → `globals.defaultImage` → `null` (always returned as URL or `null`)
    - `url`: `meta.url` → `''`
    - `noindex` / `nofollow`: `meta.{noindex,nofollow}` → `false` (global `robots` used only when neither checkbox is set)
    - `alternates`: `meta.alternates` (auto-generated alternates merged by `afterRead`)
    - `jsonLd`: `meta.jsonLd` → `null`

Example:

```ts
import { resolveMeta } from '@foundrykit/advanced-seo-plugin'

const globals = await payload.findGlobal({ slug: 'global-seo' })
const resolved = resolveMeta(doc, { globals })
// resolved.title, resolved.image, resolved.alternates, etc.
```

- `toNextMetadata(doc, globals?, options?)`
  - Build a Next.js `Metadata` object for the App Router. Recommended for pages in `app/`.

Example (app router):

```ts
import { toNextMetadata } from '@foundrykit/advanced-seo-plugin/next'

export async function generateMetadata({ params }) {
  const doc = await payload.findByID({ collection: 'posts', id: params.id })
  const globals = await payload.findGlobal({ slug: 'global-seo' })
  return toNextMetadata(doc, globals, { openGraphType: 'article' })
}
```

What `toNextMetadata` sets for you: `title`, `description`, `robots`, `alternates.canonical`, `alternates.languages`, `openGraph`, and `twitter` with sensible defaults.

## JSON-LD builders

Tree-shakeable builders help create structured data objects you can inject into the page head.

```ts
import {
  webPageJsonLd,
  articleJsonLd,
  productJsonLd,
  organizationJsonLd,
  breadcrumbJsonLd,
  buildJsonLd,
} from '@foundrykit/advanced-seo-plugin'
```

Examples:

```ts
const pageLd = webPageJsonLd({ name: 'Home', url: 'https://example.com', description: 'Welcome' })

const articleLd = articleJsonLd({
  headline: 'My article',
  url: 'https://example.com/article',
  author: { name: 'Jane Smith' },
  publisher: { name: 'Acme', logo: 'https://example.com/logo.png' },
  datePublished: '2024-01-01',
})

const merged = buildJsonLd(articleLd, { headline: 'Overridden headline' })
```

`buildJsonLd(base, overrides)` merges values while preserving `@context` and `@type` from the base template.

## Field factories & admin UI components

All UI pieces are exported so you can compose custom admin layouts instead of using the default meta group.

```ts
import {
  OverviewField,
  MetaTitleField,
  MetaUrlField,
  MetaImageField,
  MetaDescriptionField,
  MetaNoindexField,
  MetaNofollowField,
  AlternatesField,
  PreviewField,
  structuredDataRow,
} from '@foundrykit/advanced-seo-plugin'
```

Common elements:

- `OverviewField` — character counts and warnings (title ≤ 60, description ≤ 160)
- `PreviewField` — Google SERP-style preview
- `AlternatesField` — array of `{ locale, url }`
- `structuredDataRow` — JSON editor for `meta.jsonLd`

You can import these and include them in your own collection fields if you prefer a customized layout.

## Examples and edge cases

- Manual values always win. Generators only populate when the meta field is empty.
- Auto alternates run only when `global-seo.autoGenerateAlternates` is true and no manual alternates exist.
- OG generation runs only when `global-seo.enableOgGenerator` is true and `meta.image` is empty. The plugin writes the created media ID back to `meta.image`.

## Development

To develop locally (the repo contains a dev Payload app under `dev/`):

```bash
# Start the dev MongoDB
pnpm dev:db:up

# Start the dev server (Next.js + Payload dev app)
pnpm dev

# Run tests
pnpm test:int

# Build the plugin
pnpm build
```

## Contributing

If you plan to extend generators or add new JSON-LD templates, follow the existing naming and typing conventions and add unit tests for the generator hooks.

## License

MIT
