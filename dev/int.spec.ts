import type { Payload } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  await payload.destroy()
})

describe('advancedSeoPlugin integration', () => {
  test('registers the global-seo global', () => {
    expect(payload.globals['global-seo']).toBeDefined()
  })

  test('injects meta group into the posts collection', () => {
    const posts = payload.collections['posts']
    expect(posts).toBeDefined()

    const fields = posts.config.fields
    const metaGroup = fields.find((f: any) => f.name === 'meta' && f.type === 'group')
    expect(metaGroup).toBeDefined()
  })

  test('can create a post with meta fields', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'Integration test post',
        meta: {
          title: 'SEO Title',
          description: 'SEO description for the post',
        },
      },
    })

    expect((post as any).meta.title).toBe('SEO Title')
    expect((post as any).meta.description).toBe('SEO description for the post')
  })

  test('can save and retrieve meta.url (canonical URL)', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: 'Canonical URL test',
        meta: {
          url: 'https://example.com/canonical',
        },
      },
    })

    expect((post as any).meta.url).toBe('https://example.com/canonical')
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
