export type Alternate = {
  locale: string
  url: string
}

export type GlobalSeoDefaults = {
  autoGenerateAlternates?: boolean
  defaultDescription?: string
  defaultImage?: { url?: string } | null | string
  defaultTitle?: string
  robots?: string
  twitterHandle?: string
}

export type DocWithMeta = {
  description?: string
  meta?: {
    alternates?: Alternate[]
    description?: string
    image?: { url?: string } | null | string
    jsonLd?: null | Record<string, unknown>
    nofollow?: boolean
    noindex?: boolean
    title?: string
    url?: string
  }
  slug?: string
  title?: string
}

export type ResolvedMeta = {
  alternates: Alternate[]
  description: string
  image: null | string
  jsonLd: null | Record<string, unknown>
  nofollow: boolean
  noindex: boolean
  title: string
  url: string
}

export const resolveMeta = (
  doc: DocWithMeta,
  { globals }: { globals?: GlobalSeoDefaults } = {},
): ResolvedMeta => {
  const g = globals ?? {}
  const meta = doc?.meta ?? {}

  const rawImage = meta.image ?? g.defaultImage ?? null
  const image =
    rawImage && typeof rawImage === 'object' && 'url' in rawImage
      ? (rawImage.url ?? null)
      : typeof rawImage === 'string'
        ? rawImage
        : null

  // Manual alternates from the document take precedence.
  // Auto-generation (when g.autoGenerateAlternates is true) is handled
  // at the hook level before resolveMeta is called, so by the time we
  // get here the alternates array is already populated.
  const alternates: Alternate[] = meta.alternates ?? []

  return {
    alternates,
    description: meta.description ?? g.defaultDescription ?? doc.description ?? '',
    image,
    jsonLd: meta.jsonLd ?? null,
    nofollow: meta.nofollow ?? false,
    noindex: meta.noindex ?? false,
    title: meta.title ?? g.defaultTitle ?? doc.title ?? '',
    url: meta.url ?? '',
  }
}
