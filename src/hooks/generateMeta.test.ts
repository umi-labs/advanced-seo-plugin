import { describe, expect, it, vi } from 'vitest'

import { buildGenerateMetaHook } from './generateMeta.js'

const mockReq = {
  payload: {
    logger: { error: vi.fn() },
  },
} as any

const runHook = (
  hook: ReturnType<typeof buildGenerateMetaHook>,
  data: Record<string, unknown>,
) =>
  hook({
    collection: {} as any,
    context: {},
    data,
    operation: 'create',
    req: mockReq,
  })

describe('buildGenerateMetaHook', () => {
  it('returns data unchanged when neither generateTitle nor generateURL is configured', async () => {
    const hook = buildGenerateMetaHook({ collectionSlug: 'posts' })
    const data = { title: 'Hello', meta: {} }
    const result = await runHook(hook, data)
    expect(result).toEqual(data)
  })

  it('populates meta.title when empty and generateTitle is configured', async () => {
    const hook = buildGenerateMetaHook({
      collectionSlug: 'posts',
      generateTitle: ({ data }) => `${data.title} | My Site`,
    })
    const result = await runHook(hook, { title: 'Hello', meta: {} })
    expect((result as any).meta.title).toBe('Hello | My Site')
  })

  it('does not overwrite meta.title when already set', async () => {
    const hook = buildGenerateMetaHook({
      collectionSlug: 'posts',
      generateTitle: () => 'Generated title',
    })
    const result = await runHook(hook, { meta: { title: 'Existing title' } })
    expect((result as any).meta.title).toBe('Existing title')
  })

  it('populates meta.url when empty and generateURL is configured', async () => {
    const hook = buildGenerateMetaHook({
      collectionSlug: 'posts',
      generateURL: ({ data }) => `https://example.com/posts/${data.slug}`,
    })
    const result = await runHook(hook, { slug: 'my-post', meta: {} })
    expect((result as any).meta.url).toBe('https://example.com/posts/my-post')
  })

  it('does not overwrite meta.url when already set', async () => {
    const hook = buildGenerateMetaHook({
      collectionSlug: 'posts',
      generateURL: () => 'https://example.com/generated',
    })
    const result = await runHook(hook, { meta: { url: 'https://example.com/existing' } })
    expect((result as any).meta.url).toBe('https://example.com/existing')
  })

  it('populates both title and url in parallel', async () => {
    const hook = buildGenerateMetaHook({
      collectionSlug: 'posts',
      generateTitle: ({ data }) => `${data.title} | Site`,
      generateURL: ({ data }) => `https://example.com/${data.slug}`,
    })
    const result = await runHook(hook, { title: 'Hello', slug: 'hello', meta: {} })
    expect((result as any).meta.title).toBe('Hello | Site')
    expect((result as any).meta.url).toBe('https://example.com/hello')
  })

  it('skips title but still generates url when title is already set', async () => {
    const hook = buildGenerateMetaHook({
      collectionSlug: 'posts',
      generateTitle: () => 'Generated',
      generateURL: ({ data }) => `https://example.com/${data.slug}`,
    })
    const result = await runHook(hook, { slug: 'hello', meta: { title: 'Existing' } })
    expect((result as any).meta.title).toBe('Existing')
    expect((result as any).meta.url).toBe('https://example.com/hello')
  })

  it('returns null from generateTitle gracefully and still sets url', async () => {
    const hook = buildGenerateMetaHook({
      collectionSlug: 'posts',
      generateTitle: () => null,
      generateURL: () => 'https://example.com/page',
    })
    const result = await runHook(hook, { meta: {} })
    expect((result as any).meta.title).toBeUndefined()
    expect((result as any).meta.url).toBe('https://example.com/page')
  })

  it('logs and continues when generateTitle throws', async () => {
    const hook = buildGenerateMetaHook({
      collectionSlug: 'posts',
      generateTitle: () => { throw new Error('boom') },
      generateURL: () => 'https://example.com/page',
    })
    const result = await runHook(hook, { meta: {} })
    expect(mockReq.payload.logger.error).toHaveBeenCalled()
    expect((result as any).meta.url).toBe('https://example.com/page')
  })
})
