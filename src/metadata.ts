import type { DocWithMeta, GlobalSeoDefaults } from './helpers.js'

import { resolveMeta } from './helpers.js'

export type MetadataResult = {
  alternates?: {
    canonical?: string
    languages?: Record<string, string>
  }
  description?: string
  openGraph?: {
    description?: string
    images?: Array<{ url: string }>
    title?: string
    type?: string
  }
  robots?: string
  title?: string
  twitter?: {
    card?: string
    description?: string
    images?: string[]
    site?: string
    title?: string
  }
}

export type ToNextMetadataOptions = {
  /**
   * Base URL for the site. Available for future use (e.g. resolving relative URLs).
   * Does not affect the output of this function currently.
   */
  baseUrl?: string
  /**
   * OpenGraph type to set on og:type. Defaults to 'website'.
   */
  openGraphType?: 'article' | 'product' | 'website'
}

/**
 * Builds a Next.js-compatible Metadata object from a Payload document and
 * optional global SEO defaults. The return type is structurally compatible
 * with Next.js `Metadata` so it can be returned directly from a
 * `generateMetadata()` page function without a type cast.
 *
 * @example
 * // app/blog/[slug]/page.tsx
 * import { toNextMetadata } from 'advanced-seo-plugin'
 *
 * export async function generateMetadata({ params }) {
 *   const doc = await payload.findByID({ collection: 'posts', id: params.id })
 *   const globals = await payload.findGlobal({ slug: 'global-seo' })
 *   return toNextMetadata(doc, globals)
 * }
 */
export const toNextMetadata = (
  doc: DocWithMeta,
  globals?: GlobalSeoDefaults,
  options: ToNextMetadataOptions = {},
): MetadataResult => {
  const resolved = resolveMeta(doc, { globals })

  // ------------------------------------------------------------------
  // Robots
  // Per-document noindex/nofollow booleans take precedence over the
  // global robots directive. When neither is set, the global directive
  // is used (useful for staging sites). If nothing is configured, the
  // robots key is omitted entirely so the browser default applies.
  // ------------------------------------------------------------------
  let robotsString: string | undefined
  const robotsParts: string[] = []
  if (resolved.noindex) robotsParts.push('noindex')
  if (resolved.nofollow) robotsParts.push('nofollow')

  if (robotsParts.length > 0) {
    robotsString = robotsParts.join(', ')
  } else if (globals?.robots) {
    robotsString = globals.robots
  }

  // ------------------------------------------------------------------
  // Alternates
  // ------------------------------------------------------------------
  const alternatesResult: MetadataResult['alternates'] = {}
  const canonical = resolved.url || undefined
  if (canonical) {
    alternatesResult.canonical = canonical
  }
  if (resolved.alternates.length > 0) {
    alternatesResult.languages = Object.fromEntries(
      resolved.alternates.map(({ locale, url }) => [locale, url]),
    )
  }
  const hasAlternates = Boolean(canonical || resolved.alternates.length > 0)

  // ------------------------------------------------------------------
  // OpenGraph
  // ------------------------------------------------------------------
  const ogImages = resolved.image ? [{ url: resolved.image }] : []
  const openGraph: MetadataResult['openGraph'] = {
    type: options.openGraphType ?? 'website',
    ...(resolved.title && { title: resolved.title }),
    ...(resolved.description && { description: resolved.description }),
    ...(ogImages.length > 0 && { images: ogImages }),
  }

  // ------------------------------------------------------------------
  // Twitter
  // ------------------------------------------------------------------
  const twitterImages = resolved.image ? [resolved.image] : []
  const twitter: MetadataResult['twitter'] = {
    card: 'summary_large_image',
    ...(globals?.twitterHandle && { site: globals.twitterHandle }),
    ...(resolved.title && { title: resolved.title }),
    ...(resolved.description && { description: resolved.description }),
    ...(twitterImages.length > 0 && { images: twitterImages }),
  }

  // ------------------------------------------------------------------
  // Assemble result
  // ------------------------------------------------------------------
  return {
    ...(resolved.title && { title: resolved.title }),
    ...(resolved.description && { description: resolved.description }),
    ...(robotsString !== undefined && { robots: robotsString }),
    ...(hasAlternates && { alternates: alternatesResult }),
    openGraph,
    twitter,
  }
}
