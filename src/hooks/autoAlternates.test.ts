import { describe, expect, it, vi } from 'vitest'

import { buildAutoAlternatesHook } from './autoAlternates.js'

const makeReq = (globalSeoData: Record<string, unknown> = {}, shouldThrow = false) => ({
  payload: {
    findGlobal: shouldThrow
      ? vi.fn().mockRejectedValue(new Error('not found'))
      : vi.fn().mockResolvedValue(globalSeoData),
  },
})

const runHook = (
  hook: ReturnType<typeof buildAutoAlternatesHook>,
  doc: Record<string, unknown>,
  req = makeReq({ autoGenerateAlternates: true }),
) =>
  hook({
    collection: {} as any,
    context: {},
    doc,
    req: req as any,
  })

describe('buildAutoAlternatesHook', () => {
  it('returns doc unchanged when no generateAlternateURL is configured', async () => {
    const hook = buildAutoAlternatesHook({ collectionSlug: 'posts', locales: ['en', 'fr'] })
    const doc = { title: 'Hello', meta: {} }
    const result = await runHook(hook, doc)
    expect(result).toEqual(doc)
  })

  it('returns doc unchanged when locales array is empty', async () => {
    const hook = buildAutoAlternatesHook({
      collectionSlug: 'posts',
      locales: [],
      generateAlternateURL: () => 'https://example.com/en',
    })
    const doc = { title: 'Hello', meta: {} }
    const result = await runHook(hook, doc)
    expect(result).toEqual(doc)
  })

  it('returns doc unchanged when manual alternates already exist', async () => {
    const hook = buildAutoAlternatesHook({
      collectionSlug: 'posts',
      locales: ['en', 'fr'],
      generateAlternateURL: () => 'https://example.com/generated',
    })
    const doc = {
      title: 'Hello',
      meta: {
        alternates: [{ locale: 'en', url: 'https://example.com/manual' }],
      },
    }
    const result = await runHook(hook, doc)
    expect((result as any).meta.alternates).toEqual([
      { locale: 'en', url: 'https://example.com/manual' },
    ])
  })

  it('returns doc unchanged when global autoGenerateAlternates is false', async () => {
    const hook = buildAutoAlternatesHook({
      collectionSlug: 'posts',
      locales: ['en', 'fr'],
      generateAlternateURL: () => 'https://example.com/en',
    })
    const doc = { title: 'Hello', meta: {} }
    const req = makeReq({ autoGenerateAlternates: false })
    const result = await runHook(hook, doc, req)
    expect((result as any).meta?.alternates).toBeUndefined()
  })

  it('returns doc unchanged when global-seo fetch throws (first boot)', async () => {
    const hook = buildAutoAlternatesHook({
      collectionSlug: 'posts',
      locales: ['en', 'fr'],
      generateAlternateURL: () => 'https://example.com/en',
    })
    const doc = { title: 'Hello', meta: {} }
    const req = makeReq({}, true)
    const result = await runHook(hook, doc, req)
    expect(result).toEqual(doc)
  })

  it('generates alternates for each configured locale', async () => {
    const hook = buildAutoAlternatesHook({
      collectionSlug: 'posts',
      locales: ['en', 'fr', 'de'],
      generateAlternateURL: ({ locale }) => `https://example.com/${locale}/page`,
    })
    const doc = { slug: 'page', meta: {} }
    const result = await runHook(hook, doc)
    expect((result as any).meta.alternates).toEqual([
      { locale: 'en', url: 'https://example.com/en/page' },
      { locale: 'fr', url: 'https://example.com/fr/page' },
      { locale: 'de', url: 'https://example.com/de/page' },
    ])
  })

  it('skips locales where generateAlternateURL returns null', async () => {
    const hook = buildAutoAlternatesHook({
      collectionSlug: 'posts',
      locales: ['en', 'fr', 'de'],
      generateAlternateURL: ({ locale }) => (locale === 'fr' ? null : `https://example.com/${locale}`),
    })
    const doc = { meta: {} }
    const result = await runHook(hook, doc)
    expect((result as any).meta.alternates).toEqual([
      { locale: 'en', url: 'https://example.com/en' },
      { locale: 'de', url: 'https://example.com/de' },
    ])
  })

  it('returns doc unchanged when all locales return null', async () => {
    const hook = buildAutoAlternatesHook({
      collectionSlug: 'posts',
      locales: ['en', 'fr'],
      generateAlternateURL: () => null,
    })
    const doc = { meta: {} }
    const result = await runHook(hook, doc)
    expect((result as any).meta?.alternates).toBeUndefined()
  })

  it('merges generated alternates with existing meta fields', async () => {
    const hook = buildAutoAlternatesHook({
      collectionSlug: 'posts',
      locales: ['en'],
      generateAlternateURL: () => 'https://example.com/en',
    })
    const doc = { meta: { title: 'My Title', description: 'My Desc' } }
    const result = await runHook(hook, doc)
    expect((result as any).meta.title).toBe('My Title')
    expect((result as any).meta.description).toBe('My Desc')
    expect((result as any).meta.alternates).toEqual([
      { locale: 'en', url: 'https://example.com/en' },
    ])
  })

  it('passes collectionSlug and doc to generateAlternateURL', async () => {
    const generateAlternateURL = vi.fn().mockResolvedValue('https://example.com/en')
    const hook = buildAutoAlternatesHook({
      collectionSlug: 'posts',
      locales: ['en'],
      generateAlternateURL,
    })
    const doc = { id: '123', meta: {} }
    await runHook(hook, doc)
    expect(generateAlternateURL).toHaveBeenCalledWith({
      collectionSlug: 'posts',
      doc,
      locale: 'en',
    })
  })
})
