import type { CollectionAfterReadHook } from 'payload'

import type { GenerateAlternateURLArgs } from '../index.js'
import type { Alternate } from '../helpers.js'

type BuildAutoAlternatesHookArgs = {
  collectionSlug: string
  locales: string[]
  generateAlternateURL?: (args: GenerateAlternateURLArgs) => string | null | Promise<string | null>
}

/**
 * afterRead hook — auto-generates hreflang alternates when:
 *   1. The global-seo document has autoGenerateAlternates = true
 *   2. The document has no manually entered alternates
 *   3. A generateAlternateURL function is configured on the plugin
 *
 * Manual alternates always win — if the editor has added even one entry
 * the auto-generator is skipped entirely for that document.
 */
export const buildAutoAlternatesHook = ({
  collectionSlug,
  locales,
  generateAlternateURL,
}: BuildAutoAlternatesHookArgs): CollectionAfterReadHook => {
  return async ({ doc, req }) => {
    // Nothing to do if no generator or no locales configured
    if (!generateAlternateURL || locales.length === 0) {
      return doc
    }

    // Skip if the doc already has manual alternates
    const existingAlternates: Alternate[] = doc?.meta?.alternates ?? []
    if (existingAlternates.length > 0) {
      return doc
    }

    // Check the global-seo toggle
    let autoGenerate = false
    try {
      const globalSeo = await req.payload.findGlobal({
        slug: 'global-seo',
        depth: 0,
      })
      autoGenerate = Boolean((globalSeo as Record<string, unknown>).autoGenerateAlternates)
    } catch {
      // global-seo may not exist yet (first boot), skip silently
      return doc
    }

    if (!autoGenerate) {
      return doc
    }

    // Build alternates for each configured locale
    const generated: Alternate[] = []
    for (const locale of locales) {
      const url = await generateAlternateURL({ doc, locale, collectionSlug })
      if (url) {
        generated.push({ locale, url })
      }
    }

    if (generated.length === 0) {
      return doc
    }

    return {
      ...doc,
      meta: {
        ...(doc.meta ?? {}),
        alternates: generated,
      },
    }
  }
}
