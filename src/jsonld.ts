/**
 * JSON-LD template builders for common schema.org types.
 *
 * Each builder returns a fully-formed JSON-LD object that can be:
 *   - Stored directly in the `meta.jsonLd` field on a document
 *   - Used as a starting template in the Global SEO jsonLdTemplates array
 *   - Merged with doc-specific data via `buildJsonLd`
 *
 * All fields are optional — only include what you have data for.
 * See https://schema.org for the full specification of each type.
 */

export type JsonLdBase = {
  '@context': 'https://schema.org'
  '@type': string
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// WebPage
// ---------------------------------------------------------------------------

export type WebPageJsonLdArgs = {
  breadcrumb?: string
  dateModified?: string
  datePublished?: string
  description?: string
  image?: string
  name?: string
  url?: string
}

export const webPageJsonLd = (args: WebPageJsonLdArgs = {}): JsonLdBase => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  ...(args.name && { name: args.name }),
  ...(args.url && { url: args.url }),
  ...(args.description && { description: args.description }),
  ...(args.image && { image: args.image }),
  ...(args.datePublished && { datePublished: args.datePublished }),
  ...(args.dateModified && { dateModified: args.dateModified }),
  ...(args.breadcrumb && { breadcrumb: args.breadcrumb }),
})

// ---------------------------------------------------------------------------
// Article
// ---------------------------------------------------------------------------

export type ArticleJsonLdArgs = {
  articleBody?: string
  author?: string | { name: string; url?: string }
  dateModified?: string
  datePublished?: string
  description?: string
  headline?: string
  image?: string
  publisher?: { logo?: string; name: string }
  url?: string
}

export const articleJsonLd = (args: ArticleJsonLdArgs = {}): JsonLdBase => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  ...(args.headline && { headline: args.headline }),
  ...(args.url && { url: args.url }),
  ...(args.description && { description: args.description }),
  ...(args.image && { image: args.image }),
  ...(args.datePublished && { datePublished: args.datePublished }),
  ...(args.dateModified && { dateModified: args.dateModified }),
  ...(args.articleBody && { articleBody: args.articleBody }),
  ...(args.author && {
    author:
      typeof args.author === 'string'
        ? { '@type': 'Person', name: args.author }
        : { '@type': 'Person', ...args.author },
  }),
  ...(args.publisher && {
    publisher: {
      '@type': 'Organization',
      name: args.publisher.name,
      ...(args.publisher.logo && {
        logo: { '@type': 'ImageObject', url: args.publisher.logo },
      }),
    },
  }),
})

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export type ProductJsonLdArgs = {
  brand?: string
  description?: string
  image?: string
  name?: string
  offers?: {
    availability?: string
    currency?: string
    price?: number | string
    url?: string
  }
  sku?: string
  url?: string
}

export const productJsonLd = (args: ProductJsonLdArgs = {}): JsonLdBase => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  ...(args.name && { name: args.name }),
  ...(args.url && { url: args.url }),
  ...(args.description && { description: args.description }),
  ...(args.image && { image: args.image }),
  ...(args.sku && { sku: args.sku }),
  ...(args.brand && { brand: { '@type': 'Brand', name: args.brand } }),
  ...(args.offers && {
    offers: {
      '@type': 'Offer',
      ...(args.offers.price !== undefined && { price: args.offers.price }),
      ...(args.offers.currency && { priceCurrency: args.offers.currency }),
      ...(args.offers.availability && { availability: args.offers.availability }),
      ...(args.offers.url && { url: args.offers.url }),
    },
  }),
})

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

export type OrganizationJsonLdArgs = {
  description?: string
  email?: string
  logo?: string
  name?: string
  sameAs?: string[]
  telephone?: string
  url?: string
}

export const organizationJsonLd = (args: OrganizationJsonLdArgs = {}): JsonLdBase => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  ...(args.name && { name: args.name }),
  ...(args.url && { url: args.url }),
  ...(args.description && { description: args.description }),
  ...(args.email && { email: args.email }),
  ...(args.telephone && { telephone: args.telephone }),
  ...(args.logo && { logo: { '@type': 'ImageObject', url: args.logo } }),
  ...(args.sameAs && args.sameAs.length > 0 && { sameAs: args.sameAs }),
})

// ---------------------------------------------------------------------------
// BreadcrumbList
// ---------------------------------------------------------------------------

export type BreadcrumbItem = {
  id: string
  name: string
}

export const breadcrumbJsonLd = (items: BreadcrumbItem[]): JsonLdBase => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.id,
  })),
})

// ---------------------------------------------------------------------------
// Merge utility
// ---------------------------------------------------------------------------

/**
 * Merges a base JSON-LD template (e.g. from globals) with doc-specific
 * overrides. Doc-level values take precedence over the template.
 *
 * @example
 * const base = articleJsonLd({ headline: 'Default headline' })
 * const merged = buildJsonLd(base, { headline: doc.meta.title, url: doc.url })
 */
export const buildJsonLd = (
  base: JsonLdBase,
  overrides: Record<string, unknown> = {},
): JsonLdBase => ({
  ...base,
  ...overrides,
  '@context': 'https://schema.org',
  '@type': base['@type'],
})
