import type { CollectionAfterChangeHook } from 'payload'

import type { GenerateOgImageArgs } from '../index.js'

type BuildOgImageHookArgs = {
  collectionSlug: string
  mediaCollection: string
  generateOgImage?: (args: GenerateOgImageArgs) => Buffer | null | Promise<Buffer | null>
}

/**
 * afterChange hook — generates and saves an OG image when:
 *   1. The global-seo document has enableOgGenerator = true
 *   2. The document has no meta.image set
 *   3. A generateOgImage function is configured on the plugin
 *
 * The generated Buffer is saved to the configured media collection via
 * Payload's local API and the resulting media ID is written back to
 * meta.image on the document.
 */
export const buildOgImageHook = ({
  collectionSlug,
  mediaCollection,
  generateOgImage,
}: BuildOgImageHookArgs): CollectionAfterChangeHook => {
  return async ({ doc, req }) => {
    // Nothing to do if no generator configured
    if (!generateOgImage) {
      return doc
    }

    // Skip if the doc already has a meta image
    if (doc?.meta?.image) {
      return doc
    }

    // Check the global-seo toggle
    let enabled = false
    try {
      const globalSeo = await req.payload.findGlobal({
        slug: 'global-seo',
        depth: 0,
      })
      enabled = Boolean((globalSeo as Record<string, unknown>).enableOgGenerator)
    } catch {
      // global-seo may not exist yet, skip silently
      return doc
    }

    if (!enabled) {
      return doc
    }

    // Call the user-supplied generator
    let imageBuffer: Buffer | null = null
    try {
      imageBuffer = await generateOgImage({ doc, collectionSlug })
    } catch (err) {
      req.payload.logger.error({ err, msg: '[advanced-seo] generateOgImage threw an error' })
      return doc
    }

    if (!imageBuffer) {
      return doc
    }

    // Save the buffer to the media collection
    let mediaDoc: Record<string, unknown>
    try {
      const filename = `og-${collectionSlug}-${doc.id ?? Date.now()}.png`
      mediaDoc = (await req.payload.create({
        collection: mediaCollection,
        data: {},
        file: {
          data: imageBuffer,
          mimetype: 'image/png',
          name: filename,
          size: imageBuffer.length,
        },
      })) as Record<string, unknown>
    } catch (err) {
      req.payload.logger.error({ err, msg: '[advanced-seo] Failed to save OG image to media collection' })
      return doc
    }

    // Write meta.image back to the document
    try {
      const updated = await req.payload.update({
        id: doc.id,
        collection: collectionSlug,
        data: {
          meta: {
            ...(doc.meta ?? {}),
            image: mediaDoc.id,
          },
        },
      })
      return updated
    } catch (err) {
      req.payload.logger.error({ err, msg: '[advanced-seo] Failed to write meta.image back to document' })
      return doc
    }
  }
}
