import type { Payload } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  if (typeof payload?.destroy === 'function') {
    await payload.destroy()
  }
})

describe('advancedSeoPlugin integration', () => {
  test('registers the global-seo global', () => {
    const globalSeo = payload.globals.config.find((g) => g.slug === 'global-seo')
    expect(globalSeo).toBeDefined()
  })

  test('injects meta group into the posts collection', () => {
    const posts = payload.collections['posts']
    expect(posts).toBeDefined()

    const fields = posts.config.fields
    // tabbedUI wraps fields in a tabs field; find the SEO tab named 'meta'
    const tabsField = fields.find((f: any) => f.type === 'tabs') as any
    expect(tabsField).toBeDefined()
    const seoTab = tabsField?.tabs?.find((t: any) => t.name === 'meta')
    expect(seoTab).toBeDefined()
  })

  test('can create a post with meta fields', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'Integration test post',
        meta: {
          metaTitle: 'SEO Title',
          metaDescription: 'SEO description for the post',
        },
      },
    })

    expect((post as any).meta.metaTitle).toBe('SEO Title')
    expect((post as any).meta.metaDescription).toBe('SEO description for the post')
  })

  test('can save and retrieve meta.url (canonical URL)', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'Canonical URL test',
        meta: {
          canonicalUrl: 'https://example.com/canonical',
        },
      },
    })

    expect((post as any).meta.canonicalUrl).toBe('https://example.com/canonical')
  })

  test('can save and retrieve hreflang alternates', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'Alternates test',
        meta: {
          alternates: [
            { locale: 'en', url: 'https://example.com/en/page' },
            { locale: 'fr', url: 'https://example.com/fr/page' },
          ],
        },
      },
    })

    expect((post as any).meta.alternates).toHaveLength(2)
    expect((post as any).meta.alternates[0]).toMatchObject({ locale: 'en', url: 'https://example.com/en/page' })
    expect((post as any).meta.alternates[1]).toMatchObject({ locale: 'fr', url: 'https://example.com/fr/page' })
  })

  test('can save and retrieve JSON-LD structured data', async () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Test article',
    }

    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'JSON-LD test',
        meta: {
          jsonLd,
        },
      },
    })

    expect((post as any).meta.jsonLd).toMatchObject(jsonLd)
  })

  test('does not inject meta group into collections not in the plugin config', () => {
    const media = payload.collections['media']
    expect(media).toBeDefined()

    const fields = media.config.fields
    const metaGroup = fields.find((f: any) => f.name === 'meta' && f.type === 'group')
    expect(metaGroup).toBeUndefined()
  })
})
