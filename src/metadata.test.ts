import { describe, expect, it } from 'vitest'

import { toNextMetadata } from './metadata.js'

describe('toNextMetadata', () => {
  describe('title and description', () => {
    it('populates title and description from meta fields', () => {
      const result = toNextMetadata({ meta: { title: 'My Title', description: 'My Desc' } })
      expect(result.title).toBe('My Title')
      expect(result.description).toBe('My Desc')
    })

    it('omits title key when resolved title is empty', () => {
      const result = toNextMetadata({})
      expect(result.title).toBeUndefined()
    })

    it('omits description key when resolved description is empty', () => {
      const result = toNextMetadata({})
      expect(result.description).toBeUndefined()
    })

    it('falls back to global defaultTitle via resolveMeta', () => {
      const result = toNextMetadata(
        { meta: {} },
        { defaultTitle: 'Global Title' },
      )
      expect(result.title).toBe('Global Title')
    })

    it('falls back to doc.title via resolveMeta', () => {
      const result = toNextMetadata({ title: 'Doc Title', meta: {} })
      expect(result.title).toBe('Doc Title')
    })
  })

  describe('robots string construction', () => {
    it('omits robots key when noindex and nofollow are false and no global robots set', () => {
      const result = toNextMetadata({ meta: {} })
      expect(result.robots).toBeUndefined()
    })

    it('robots is "noindex" when only meta.noindex is true', () => {
      const result = toNextMetadata({ meta: { noindex: true } })
      expect(result.robots).toBe('noindex')
    })

    it('robots is "nofollow" when only meta.nofollow is true', () => {
      const result = toNextMetadata({ meta: { nofollow: true } })
      expect(result.robots).toBe('nofollow')
    })

    it('robots is "noindex, nofollow" when both flags are true', () => {
      const result = toNextMetadata({ meta: { noindex: true, nofollow: true } })
      expect(result.robots).toBe('noindex, nofollow')
    })

    it('uses global robots string when no per-doc flags are set', () => {
      const result = toNextMetadata({ meta: {} }, { robots: 'noindex, nofollow' })
      expect(result.robots).toBe('noindex, nofollow')
    })

    it('per-doc noindex overrides global robots string', () => {
      const result = toNextMetadata(
        { meta: { noindex: true } },
        { robots: 'noindex, nofollow' },
      )
      // Per-doc booleans win — only 'noindex' since nofollow is false
      expect(result.robots).toBe('noindex')
    })

    it('omits robots key when global robots is an empty string', () => {
      const result = toNextMetadata({ meta: {} }, { robots: '' })
      expect(result.robots).toBeUndefined()
    })
  })

  describe('alternates', () => {
    it('omits alternates key when no url and no alternates array', () => {
      const result = toNextMetadata({ meta: {} })
      expect(result.alternates).toBeUndefined()
    })

    it('populates alternates.canonical from meta.url', () => {
      const result = toNextMetadata({ meta: { url: 'https://example.com/page' } })
      expect(result.alternates?.canonical).toBe('https://example.com/page')
    })

    it('populates alternates.languages from alternates array', () => {
      const result = toNextMetadata({
        meta: {
          alternates: [
            { locale: 'en', url: 'https://example.com/en/page' },
            { locale: 'fr', url: 'https://example.com/fr/page' },
          ],
        },
      })
      expect(result.alternates?.languages).toEqual({
        en: 'https://example.com/en/page',
        fr: 'https://example.com/fr/page',
      })
    })

    it('canonical and languages can coexist', () => {
      const result = toNextMetadata({
        meta: {
          url: 'https://example.com/page',
          alternates: [{ locale: 'fr', url: 'https://example.com/fr/page' }],
        },
      })
      expect(result.alternates?.canonical).toBe('https://example.com/page')
      expect(result.alternates?.languages).toEqual({ fr: 'https://example.com/fr/page' })
    })

    it('omits alternates key when meta.url is empty string and alternates array is empty', () => {
      const result = toNextMetadata({ meta: { url: '', alternates: [] } })
      expect(result.alternates).toBeUndefined()
    })
  })

  describe('openGraph', () => {
    it('openGraph type defaults to "website"', () => {
      const result = toNextMetadata({ meta: {} })
      expect(result.openGraph?.type).toBe('website')
    })

    it('openGraph type is overridden by options.openGraphType', () => {
      const result = toNextMetadata({ meta: {} }, undefined, { openGraphType: 'article' })
      expect(result.openGraph?.type).toBe('article')
    })

    it('openGraph.images is absent when no image', () => {
      const result = toNextMetadata({ meta: {} })
      expect(result.openGraph?.images).toBeUndefined()
    })

    it('openGraph.images contains the resolved image url', () => {
      const result = toNextMetadata({ meta: { image: { url: 'https://example.com/og.jpg' } } })
      expect(result.openGraph?.images).toEqual([{ url: 'https://example.com/og.jpg' }])
    })

    it('openGraph receives resolved title and description', () => {
      const result = toNextMetadata({ meta: { title: 'OG Title', description: 'OG Desc' } })
      expect(result.openGraph?.title).toBe('OG Title')
      expect(result.openGraph?.description).toBe('OG Desc')
    })

    it('openGraph title and description are absent when empty', () => {
      const result = toNextMetadata({})
      expect(result.openGraph?.title).toBeUndefined()
      expect(result.openGraph?.description).toBeUndefined()
    })
  })

  describe('twitter', () => {
    it('twitter.card is always "summary_large_image"', () => {
      const result = toNextMetadata({ meta: {} })
      expect(result.twitter?.card).toBe('summary_large_image')
    })

    it('twitter.site is absent when globals has no twitterHandle', () => {
      const result = toNextMetadata({ meta: {} })
      expect(result.twitter?.site).toBeUndefined()
    })

    it('twitter.site is set from globals.twitterHandle', () => {
      const result = toNextMetadata({ meta: {} }, { twitterHandle: '@mysite' })
      expect(result.twitter?.site).toBe('@mysite')
    })

    it('twitter.images is absent when no image', () => {
      const result = toNextMetadata({ meta: {} })
      expect(result.twitter?.images).toBeUndefined()
    })

    it('twitter.images contains the resolved image url string', () => {
      const result = toNextMetadata({ meta: { image: 'https://example.com/og.jpg' } })
      expect(result.twitter?.images).toEqual(['https://example.com/og.jpg'])
    })
  })

  describe('edge cases', () => {
    it('works with no meta property on doc', () => {
      const result = toNextMetadata({ title: 'Bare doc' })
      expect(result.title).toBe('Bare doc')
      expect(result.openGraph?.type).toBe('website')
    })

    it('works with no globals argument', () => {
      const result = toNextMetadata({ meta: { title: 'Hello' } })
      expect(result.title).toBe('Hello')
    })

    it('works with a completely empty doc', () => {
      const result = toNextMetadata({})
      expect(result.openGraph?.type).toBe('website')
      expect(result.twitter?.card).toBe('summary_large_image')
      expect(result.title).toBeUndefined()
      expect(result.robots).toBeUndefined()
      expect(result.alternates).toBeUndefined()
    })

    it('accepts baseUrl option without error', () => {
      expect(() =>
        toNextMetadata({ meta: { title: 'Test' } }, undefined, {
          baseUrl: 'https://example.com',
        }),
      ).not.toThrow()
    })
  })
})
