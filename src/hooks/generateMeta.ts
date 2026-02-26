import type { CollectionBeforeChangeHook } from 'payload'

import type { GenerateTitleArgs, GenerateURLArgs } from '../index.js'

type BuildGenerateMetaHookArgs = {
  collectionSlug: string
  generateTitle?: (args: GenerateTitleArgs) => string | null | Promise<string | null>
  generateURL?: (args: GenerateURLArgs) => string | null | Promise<string | null>
}

/**
 * beforeChange hook — auto-populates meta.title and meta.url when:
 *   - generateTitle is configured and meta.title is empty
 *   - generateURL is configured and meta.url is empty
 *
 * Existing values are never overwritten — the editor always wins.
 * Both functions are called in parallel for efficiency.
 */
export const buildGenerateMetaHook = ({
  collectionSlug,
  generateTitle,
  generateURL,
}: BuildGenerateMetaHookArgs): CollectionBeforeChangeHook => {
  return async ({ data, req }) => {
    const meta = (data.meta as Record<string, unknown>) ?? {}

    const safeCall = async (
      fn: () => string | null | Promise<string | null>,
      onError: (err: unknown) => void,
    ): Promise<null | string> => {
      try {
        return await fn()
      } catch (err) {
        onError(err)
        return null
      }
    }

    const [generatedTitle, generatedURL] = await Promise.all([
      // Only call generateTitle if the field is currently empty
      generateTitle && !meta.title
        ? safeCall(
            () => generateTitle({ collectionSlug, data, req }),
            (err) =>
              req.payload.logger.error({ err, msg: '[advanced-seo] generateTitle threw an error' }),
          )
        : null,

      // Only call generateURL if the field is currently empty
      generateURL && !meta.url
        ? safeCall(
            () => generateURL({ collectionSlug, data, req }),
            (err) =>
              req.payload.logger.error({ err, msg: '[advanced-seo] generateURL threw an error' }),
          )
        : null,
    ])

    // Only patch the data object if something was actually generated
    if (!generatedTitle && !generatedURL) {
      return data
    }

    return {
      ...data,
      meta: {
        ...meta,
        ...(generatedTitle ? { title: generatedTitle } : {}),
        ...(generatedURL ? { url: generatedURL } : {}),
      },
    }
  }
}
