import { describe, expect, it } from 'vitest'

import { resolveMeta } from './helpers.js'

describe('resolveMeta', () => {
  describe('title resolution', () => {
    it('uses meta.title when set', () => {
      const result = resolveMeta({ title: 'Doc title', meta: { title: 'Meta title' } })
      expect(result.title).toBe('Meta title')
    })

    it('falls back to global defaultTitle when meta.title is empty', () => {
      const result = resolveMeta(
        { title: 'Doc title', meta: {} },
        { globals: { defaultTitle: 'Global title' } },
      )
      expect(result.title).toBe('Global title')
    })

    it('falls back to doc.title when meta and global are empty', () => {
      const result = resolveMeta({ title: 'Doc title', meta: {} })
      expect(result.title).toBe('Doc title')
    })

    it('returns empty string when all title sources are empty', () => {
      const result = resolveMeta({})
      expect(result.title).toBe('')
    })
  })

  describe('description resolution', () => {
    it('uses meta.description when set', () => {
      const result = resolveMeta({ meta: { description: 'Meta desc' } })
      expect(result.description).toBe('Meta desc')
    })

    it('falls back to global defaultDescription', () => {
      const result = resolveMeta(
        { meta: {} },
        { globals: { defaultDescription: 'Global desc' } },
      )
      expect(result.description).toBe('Global desc')
    })

    it('falls back to doc.description', () => {
      const result = resolveMeta({ description: 'Doc desc', meta: {} })
      expect(result.description).toBe('Doc desc')
    })
  })

  describe('image resolution', () => {
    it('extracts url from a populated image object', () => {
      const result = resolveMeta({ meta: { image: { url: 'https://example.com/img.jpg' } } })
      expect(result.image).toBe('https://example.com/img.jpg')
    })

    it('uses a plain string image directly', () => {
      const result = resolveMeta({ meta: { image: 'https://example.com/img.jpg' } })
      expect(result.image).toBe('https://example.com/img.jpg')
    })

    it('falls back to global defaultImage object', () => {
      const result = resolveMeta(
        { meta: {} },
        { globals: { defaultImage: { url: 'https://example.com/default.jpg' } } },
      )
      expect(result.image).toBe('https://example.com/default.jpg')
    })

    it('falls back to global defaultImage string', () => {
      const result = resolveMeta(
        { meta: {} },
        { globals: { defaultImage: 'https://example.com/default.jpg' } },
      )
      expect(result.image).toBe('https://example.com/default.jpg')
    })

    it('returns null when no image is set anywhere', () => {
      const result = resolveMeta({ meta: {} })
      expect(result.image).toBeNull()
    })

    it('returns null when image object has no url', () => {
      const result = resolveMeta({ meta: { image: {} } })
      expect(result.image).toBeNull()
    })
  })

  describe('alternates', () => {
    it('returns manual alternates from the document', () => {
      const alternates = [
        { locale: 'en', url: 'https://example.com/en' },
        { locale: 'fr', url: 'https://example.com/fr' },
      ]
      const result = resolveMeta({ meta: { alternates } })
      expect(result.alternates).toEqual(alternates)
    })

    it('returns empty array when no alternates are set', () => {
      const result = resolveMeta({ meta: {} })
      expect(result.alternates).toEqual([])
    })
  })

  describe('jsonLd', () => {
    it('returns jsonLd from meta', () => {
      const jsonLd = { '@context': 'https://schema.org', '@type': 'Article', headline: 'Test' }
      const result = resolveMeta({ meta: { jsonLd } })
      expect(result.jsonLd).toEqual(jsonLd)
    })

    it('returns null when no jsonLd set', () => {
      const result = resolveMeta({ meta: {} })
      expect(result.jsonLd).toBeNull()
    })
  })

  describe('noindex / nofollow resolution', () => {
    it('noindex defaults to false when not set', () => {
      const result = resolveMeta({ meta: {} })
      expect(result.noindex).toBe(false)
    })

    it('noindex is true when meta.noindex is true', () => {
      const result = resolveMeta({ meta: { noindex: true } })
      expect(result.noindex).toBe(true)
    })

    it('noindex is false when meta.noindex is explicitly false', () => {
      const result = resolveMeta({ meta: { noindex: false } })
      expect(result.noindex).toBe(false)
    })

    it('nofollow defaults to false when not set', () => {
      const result = resolveMeta({ meta: {} })
      expect(result.nofollow).toBe(false)
    })

    it('nofollow is true when meta.nofollow is true', () => {
      const result = resolveMeta({ meta: { nofollow: true } })
      expect(result.nofollow).toBe(true)
    })

    it('there is no global fallback for noindex (per-document only)', () => {
      // Passing a globals object does not affect noindex resolution
      const result = resolveMeta({ meta: {} }, { globals: { defaultTitle: 'Global' } })
      expect(result.noindex).toBe(false)
    })
  })

  describe('url resolution', () => {
    it('returns empty string when meta.url is not set', () => {
      const result = resolveMeta({ meta: {} })
      expect(result.url).toBe('')
    })

    it('passes meta.url through', () => {
      const result = resolveMeta({ meta: { url: 'https://example.com/page' } })
      expect(result.url).toBe('https://example.com/page')
    })
  })
})
