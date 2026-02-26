import { describe, expect, it } from 'vitest'

import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildJsonLd,
  organizationJsonLd,
  productJsonLd,
  webPageJsonLd,
} from './jsonld.js'

describe('webPageJsonLd', () => {
  it('always sets @context and @type', () => {
    const result = webPageJsonLd()
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('WebPage')
  })

  it('includes provided fields', () => {
    const result = webPageJsonLd({ name: 'Home', url: 'https://example.com', description: 'Desc' })
    expect(result.name).toBe('Home')
    expect(result.url).toBe('https://example.com')
    expect(result.description).toBe('Desc')
  })

  it('omits undefined fields', () => {
    const result = webPageJsonLd({ name: 'Home' })
    expect(result).not.toHaveProperty('url')
    expect(result).not.toHaveProperty('description')
  })
})

describe('articleJsonLd', () => {
  it('always sets @context and @type', () => {
    const result = articleJsonLd()
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('Article')
  })

  it('sets author as Person object when passed a string', () => {
    const result = articleJsonLd({ author: 'Jane Smith' })
    expect(result.author).toEqual({ '@type': 'Person', name: 'Jane Smith' })
  })

  it('sets author as Person object when passed an object', () => {
    const result = articleJsonLd({ author: { name: 'Jane Smith', url: 'https://example.com' } })
    expect(result.author).toEqual({
      '@type': 'Person',
      name: 'Jane Smith',
      url: 'https://example.com',
    })
  })

  it('sets publisher with logo as ImageObject', () => {
    const result = articleJsonLd({
      publisher: { name: 'Acme', logo: 'https://example.com/logo.png' },
    })
    expect(result.publisher).toEqual({
      '@type': 'Organization',
      name: 'Acme',
      logo: { '@type': 'ImageObject', url: 'https://example.com/logo.png' },
    })
  })

  it('sets publisher without logo when not provided', () => {
    const result = articleJsonLd({ publisher: { name: 'Acme' } })
    expect(result.publisher).toEqual({ '@type': 'Organization', name: 'Acme' })
  })
})

describe('productJsonLd', () => {
  it('always sets @context and @type', () => {
    const result = productJsonLd()
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('Product')
  })

  it('sets brand as Brand object', () => {
    const result = productJsonLd({ brand: 'Acme' })
    expect(result.brand).toEqual({ '@type': 'Brand', name: 'Acme' })
  })

  it('sets offers as Offer object with all fields', () => {
    const result = productJsonLd({
      offers: { price: 9.99, currency: 'USD', availability: 'InStock', url: 'https://example.com' },
    })
    expect(result.offers).toEqual({
      '@type': 'Offer',
      price: 9.99,
      priceCurrency: 'USD',
      availability: 'InStock',
      url: 'https://example.com',
    })
  })

  it('includes price of 0', () => {
    const result = productJsonLd({ offers: { price: 0 } })
    expect((result.offers as Record<string, unknown>).price).toBe(0)
  })
})

describe('organizationJsonLd', () => {
  it('always sets @context and @type', () => {
    const result = organizationJsonLd()
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('Organization')
  })

  it('sets logo as ImageObject', () => {
    const result = organizationJsonLd({ logo: 'https://example.com/logo.png' })
    expect(result.logo).toEqual({ '@type': 'ImageObject', url: 'https://example.com/logo.png' })
  })

  it('sets sameAs array', () => {
    const result = organizationJsonLd({
      sameAs: ['https://twitter.com/acme', 'https://linkedin.com/acme'],
    })
    expect(result.sameAs).toEqual(['https://twitter.com/acme', 'https://linkedin.com/acme'])
  })

  it('omits sameAs when empty array', () => {
    const result = organizationJsonLd({ sameAs: [] })
    expect(result).not.toHaveProperty('sameAs')
  })
})

describe('breadcrumbJsonLd', () => {
  it('always sets @context and @type', () => {
    const result = breadcrumbJsonLd([])
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('BreadcrumbList')
  })

  it('maps items to ListItem with 1-based position', () => {
    const result = breadcrumbJsonLd([
      { id: 'https://example.com', name: 'Home' },
      { id: 'https://example.com/blog', name: 'Blog' },
    ])
    expect(result.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://example.com/blog' },
    ])
  })
})

describe('buildJsonLd', () => {
  it('merges overrides onto base', () => {
    const base = articleJsonLd({ headline: 'Base headline', url: 'https://example.com' })
    const result = buildJsonLd(base, { headline: 'Override headline' })
    expect(result.headline).toBe('Override headline')
    expect(result.url).toBe('https://example.com')
  })

  it('always preserves @context and @type from base', () => {
    const base = articleJsonLd()
    const result = buildJsonLd(base, {
      '@context': 'https://evil.com' as 'https://schema.org',
      '@type': 'Hacked',
    })
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('Article')
  })
})
