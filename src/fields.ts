import type {
  ArrayField,
  CheckboxField,
  RowField,
  TextareaField,
  TextField,
  UIField,
  UploadField,
} from 'payload'

export type OverviewFieldOptions = {
  descriptionPath?: string
  imagePath?: string
  name?: string
  titlePath?: string
}

export const OverviewField = (opts: OverviewFieldOptions = {}): UIField => ({
  name: opts.name ?? 'overview',
  type: 'ui',
  admin: {
    components: {
      Field: {
        clientProps: {
          descriptionPath: opts.descriptionPath,
          imagePath: opts.imagePath,
          titlePath: opts.titlePath,
        },
        path: 'advanced-seo-plugin/client#OverviewComponent',
      },
    },
  },
})

export type MetaTitleFieldOptions = {
  hasGenerateFn?: boolean
  label?: string
  /** Maximum recommended character count. @default 60 */
  max?: number
  /** Minimum recommended character count. @default 50 */
  min?: number
  name?: string
}

export const MetaTitleField = (opts: MetaTitleFieldOptions = {}): TextField => ({
  name: opts.name ?? 'metaTitle',
  type: 'text',
  admin: {
    components: {
      Field: {
        clientProps: {
          hasGenerateFn: opts.hasGenerateFn ?? false,
          max: opts.max ?? 60,
          min: opts.min ?? 50,
        },
        path: 'advanced-seo-plugin/client#MetaTitleComponent',
      },
    },
  },
  label: opts.label ?? 'Meta Title',
})

export type MetaImageFieldOptions = {
  label?: string
  name?: string
  relationTo?: string
}

export const MetaImageField = (opts: MetaImageFieldOptions = {}): UploadField => ({
  name: opts.name ?? 'metaImage',
  type: 'upload',
  label: opts.label ?? 'Meta Image',
  relationTo: (opts.relationTo ?? 'media') as 'media',
})

export type MetaDescriptionFieldOptions = {
  label?: string
  /** Maximum recommended character count. @default 150 */
  max?: number
  /** Minimum recommended character count. @default 100 */
  min?: number
  name?: string
}

export const MetaDescriptionField = (opts: MetaDescriptionFieldOptions = {}): TextareaField => ({
  name: opts.name ?? 'metaDescription',
  type: 'textarea',
  admin: {
    components: {
      Field: {
        clientProps: {
          max: opts.max ?? 150,
          min: opts.min ?? 100,
        },
        path: 'advanced-seo-plugin/client#MetaDescriptionComponent',
      },
    },
  },
  label: opts.label ?? 'Meta Description',
})

export type MetaPreviewFieldOptions = {
  descriptionPath?: string
  hasGenerateFn?: boolean
  name?: string
  position?: 'sidebar'
  titlePath?: string
}

export const MetaPreviewField = (opts: MetaPreviewFieldOptions = {}): UIField => ({
  name: opts.name ?? 'preview',
  type: 'ui',
  admin: {
    components: {
      Field: {
        clientProps: {
          descriptionPath: opts.descriptionPath,
          hasGenerateFn: opts.hasGenerateFn,
          titlePath: opts.titlePath,
        },
        path: 'advanced-seo-plugin/client#PreviewComponent',
      },
      position: opts.position,
    },
  },
})

export type MetaUrlFieldOptions = {
  label?: string
  name?: string
}

export const MetaUrlField = (opts: MetaUrlFieldOptions = {}): TextField => ({
  name: opts.name ?? 'canonicalUrl',
  type: 'text',
  admin: {
    description:
      'Absolute canonical URL for this page. Auto-populated if generateURL is configured.',
  },
  label: opts.label ?? 'Canonical URL',
})

export type MetaNoindexFieldOptions = {
  label?: string
  name?: string
}

export const MetaNoindexField = (opts: MetaNoindexFieldOptions = {}): CheckboxField => ({
  name: opts.name ?? 'noindex',
  type: 'checkbox',
  admin: {
    description: 'Instruct search engines not to index this page.',
  },
  defaultValue: false,
  label: opts.label ?? 'No Index',
})

export type MetaNofollowFieldOptions = {
  label?: string
  name?: string
}

export const MetaNofollowField = (opts: MetaNofollowFieldOptions = {}): CheckboxField => ({
  name: opts.name ?? 'nofollow',
  type: 'checkbox',
  admin: {
    description: 'Instruct search engines not to follow links on this page.',
  },
  defaultValue: false,
  label: opts.label ?? 'No Follow',
})

export type MetaAlternatesFieldOptions = {
  label?: string
  name?: string
}

export const MetaAlternatesField = (opts: MetaAlternatesFieldOptions = {}): ArrayField => ({
  name: opts.name ?? 'alternates',
  type: 'array',
  admin: {
    description: 'Add hreflang alternate URLs for each locale this page is available in.',
  },
  fields: [
    {
      name: 'locale',
      type: 'text',
      admin: {
        description: 'BCP 47 locale tag, e.g. en, en-US, fr, de',
        width: '30%',
      },
      label: 'Locale',
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'Absolute URL for this locale, e.g. https://example.com/fr/page',
        width: '70%',
      },
      label: 'URL',
      required: true,
    },
  ],
  label: opts.label ?? 'Hreflang Alternates',
})

export type MetaJsonLdFieldOptions = {
  label?: string
  name?: string
}

export const MetaJsonLdField = (opts: MetaJsonLdFieldOptions = {}): import('payload').JSONField => ({
  name: opts.name ?? 'jsonLd',
  type: 'json',
  admin: {
    components: {
      Field: 'advanced-seo-plugin/client#JsonLdEditorComponent',
    },
  },
  label: opts.label ?? 'JSON-LD Structured Data',
  validate: validateJsonLd,
})

const KNOWN_SCHEMA_TYPES = ['WebPage', 'Article', 'Product', 'Organization', 'BreadcrumbList']

const REQUIRED_FIELDS_BY_TYPE: Record<string, string[]> = {
  Article: ['headline'],
  BreadcrumbList: ['itemListElement'],
  Organization: ['name'],
  Product: ['name'],
  WebPage: [],
}

function validateJsonLd(value: unknown): string | true {
  // Empty / null is fine — schema markup is optional
  if (value === null || value === undefined) return true

  // Payload may pass the value as a JSON string — parse it
  let obj: Record<string, unknown>
  if (typeof value === 'string') {
    if (value.trim() === '' || value.trim() === '{}') return true
    try {
      const parsed = JSON.parse(value) as unknown
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        return 'Structured data must be a JSON object.'
      }
      obj = parsed as Record<string, unknown>
    } catch {
      return 'Structured data contains invalid JSON.'
    }
  } else if (typeof value === 'object' && !Array.isArray(value)) {
    if (Object.keys(value as object).length === 0) return true
    obj = value as Record<string, unknown>
  } else {
    return 'Structured data must be a JSON object.'
  }

  if (obj['@context'] !== 'https://schema.org') {
    return 'Structured data must have "@context": "https://schema.org".'
  }

  const type = obj['@type'] as string | undefined
  if (!type) {
    return 'Structured data must have an "@type" property.'
  }

  if (!KNOWN_SCHEMA_TYPES.includes(type)) {
    return `Unknown schema type "${type}". Expected one of: ${KNOWN_SCHEMA_TYPES.join(', ')}.`
  }

  const required = REQUIRED_FIELDS_BY_TYPE[type] ?? []
  for (const field of required) {
    if (!obj[field]) {
      return `Schema type "${type}" requires the "${field}" field.`
    }
  }

  if (type === 'BreadcrumbList') {
    const items = obj['itemListElement']
    if (!Array.isArray(items) || items.length === 0) {
      return 'BreadcrumbList requires at least one item in "itemListElement".'
    }
    for (const [i, item] of (items as unknown[]).entries()) {
      const it = item as Record<string, unknown>
      if (!it['name']) return `Breadcrumb item ${i + 1} is missing a "name".`
      if (!it['item']) return `Breadcrumb item ${i + 1} is missing a URL ("item").`
    }
  }

  return true
}

export const structuredDataRow: RowField = {
  type: 'row',
  fields: [MetaJsonLdField()],
}
