import type { CollectionSlug, Config, Field, TabsField } from 'payload'

import {
  MetaJsonLdField,
  MetaAlternatesField,
  MetaDescriptionField,
  MetaImageField,
  MetaNofollowField,
  MetaNoindexField,
  MetaPreviewField,
  MetaTitleField,
  MetaUrlField,
  OverviewField,
  structuredDataRow,
} from './fields.js'
import { getGlobalSeoGlobal } from './global.js'
import { buildAutoAlternatesHook } from './hooks/autoAlternates.js'
import { buildGenerateMetaHook } from './hooks/generateMeta.js'
import { buildOgImageHook } from './hooks/ogImageGenerator.js'

// ---------------------------------------------------------------------------
// Default JSON-LD templates seeded into global-seo on first run
// ---------------------------------------------------------------------------

const DEFAULT_JSON_LD_TEMPLATES = [
  {
    name: 'Web Page',
    template: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
    },
  },
  {
    name: 'Article',
    template: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: '',
    },
  },
  {
    name: 'Product',
    template: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: '',
    },
  },
  {
    name: 'Organization',
    template: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: '',
    },
  },
  {
    name: 'Breadcrumb Trail',
    template: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', item: '', name: 'Home', position: 1 }],
    },
  },
]

export type GenerateAlternateURLArgs = {
  collectionSlug: string
  doc: Record<string, unknown>
  locale: string
}

export type GenerateOgImageArgs = {
  collectionSlug: string
  doc: Record<string, unknown>
}

export type GenerateTitleArgs = {
  collectionSlug: string
  data: Record<string, unknown>
  req: import('payload').PayloadRequest
}

export type GenerateURLArgs = {
  collectionSlug: string
  data: Record<string, unknown>
  req: import('payload').PayloadRequest
}

export type AdvancedSeoPluginConfig = {
  /**
   * Collections to inject the `meta` SEO group into.
   * Set a collection slug to `true` to enable.
   */
  collections?: Partial<Record<CollectionSlug, true>>
  /**
   * Disable the plugin without uninstalling it.
   * Keeps DB schema consistent for migrations.
   * @default false
   */
  disabled?: boolean
  /**
   * Build the URL for an auto-generated alternate.
   * Called once per locale for each document on read.
   * Return null to skip a locale.
   */
  generateAlternateURL?: (args: GenerateAlternateURLArgs) => null | Promise<null | string> | string
  /**
   * Called when the OG image generator is enabled and a document has no
   * meta.image set. Return a Buffer (PNG/JPEG) to save as the OG image,
   * or null to skip generation for this document.
   */
  generateOgImage?: (args: GenerateOgImageArgs) => Buffer | null | Promise<Buffer | null>
  /**
   * Auto-populate meta.title on save when the field is empty.
   * Return a string to set the title, or null to skip.
   */
  generateTitle?: (args: GenerateTitleArgs) => string | null | Promise<string | null>
  /**
   * Auto-populate meta.url (canonical URL) on save when the field is empty.
   * Return a string to set the URL, or null to skip.
   */
  generateURL?: (args: GenerateURLArgs) => string | null | Promise<string | null>
  /**
   * BCP 47 locale codes used when auto-generating hreflang alternates.
   * Required for auto-alternates to work.
   * @example ['en', 'fr', 'de']
   */
  locales?: string[]
  /**
   * Media collection slug(s) used for the image picker.
   * @default ['media']
   */
  mediaCollection?: string[]
  /**
   * When true, injects the SEO fields into a dedicated "SEO" tab using Payload's Tabs Field.
   * If the collection's first field is already a `tabs` field, the SEO tab is appended to it.
   * Otherwise a new tabs field is created with a "Content" tab wrapping existing fields and
   * an "SEO" tab containing the meta fields.
   * @default false
   */
  tabbedUI?: boolean
}

export { resolveMeta } from './helpers.js'
export type { Alternate, DocWithMeta, GlobalSeoDefaults, ResolvedMeta } from './helpers.js'
export {
  MetaJsonLdField,
  MetaAlternatesField,
  MetaDescriptionField,
  MetaImageField,
  MetaNofollowField,
  MetaNoindexField,
  MetaPreviewField,
  MetaTitleField,
  MetaUrlField,
  OverviewField,
  structuredDataRow,
}
export {
  articleJsonLd,
  breadcrumbJsonLd,
  buildJsonLd,
  organizationJsonLd,
  productJsonLd,
  webPageJsonLd,
} from './jsonld.js'
export type {
  ArticleJsonLdArgs,
  BreadcrumbItem,
  JsonLdBase,
  OrganizationJsonLdArgs,
  ProductJsonLdArgs,
  WebPageJsonLdArgs,
} from './jsonld.js'
export { toNextMetadata } from './metadata.js'
export type { MetadataResult, ToNextMetadataOptions } from './metadata.js'

export const advancedSeoPlugin =
  (pluginOptions: AdvancedSeoPluginConfig) =>
  (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }
    const mediaCollection = pluginOptions.mediaCollection ?? ['media']

    // Register the global-seo global
    config.globals = [...(config.globals || []), getGlobalSeoGlobal({ mediaCollection })]

    // Inject meta group + hooks into configured collections
    if (pluginOptions.collections) {
      config.collections = (config.collections || []).map((collection) => {
        if (!pluginOptions.collections![collection.slug]) {
          return collection
        }

        const collectionSlug = collection.slug

        const generateMetaHook = buildGenerateMetaHook({
          collectionSlug,
          generateTitle: pluginOptions.generateTitle,
          generateURL: pluginOptions.generateURL,
        })

        const autoAlternatesHook = buildAutoAlternatesHook({
          collectionSlug,
          generateAlternateURL: pluginOptions.generateAlternateURL,
          locales: pluginOptions.locales ?? [],
        })

        const ogImageHook = buildOgImageHook({
          collectionSlug,
          generateOgImage: pluginOptions.generateOgImage,
          mediaCollection: mediaCollection[0] ?? 'media',
        })

        const endpoints = Array.isArray(collection.endpoints) ? [...collection.endpoints] : []

        // Always register the generate-title endpoint — uses user's generateTitle if provided,
        // otherwise falls back to: doc.title + " | " + global-seo siteName
        endpoints.push({
          handler: async (req: import('payload').PayloadRequest) => {
            try {
              const data = (await req.json?.().catch(() => ({})) ?? {}) as Record<string, unknown>

              let title: null | string = null

              if (pluginOptions.generateTitle) {
                title = await pluginOptions.generateTitle({ collectionSlug, data, req })
              } else {
                // Built-in default: "Doc Title | Site Name"
                const docTitle =
                  typeof data['title'] === 'string' ? data['title'] : null

                let siteName: null | string = null
                try {
                  const globalSeo = await req.payload.findGlobal({ slug: 'global-seo' })
                  siteName =
                    typeof (globalSeo as Record<string, unknown>)['siteName'] === 'string'
                      ? ((globalSeo as Record<string, unknown>)['siteName'] as string)
                      : null
                } catch {
                  // global-seo not found — skip site name
                }

                if (docTitle && siteName) title = `${docTitle} | ${siteName}`
                else if (docTitle) title = docTitle
              }

              return Response.json({ title })
            } catch {
              return Response.json({ title: null })
            }
          },
          method: 'post',
          path: '/generate-title',
        })

        const seoFields: Field[] = [
          OverviewField({
            descriptionPath: 'meta.metaDescription',
            imagePath: 'meta.metaImage',
            titlePath: 'meta.metaTitle',
          }),
          MetaTitleField({ hasGenerateFn: true }),
          MetaUrlField({}),
          MetaImageField({ relationTo: mediaCollection[0] ?? 'media' }),
          MetaDescriptionField({}),
          MetaNoindexField({}),
          MetaNofollowField({}),
          MetaAlternatesField({}),
          structuredDataRow,
          MetaPreviewField({
            descriptionPath: 'meta.metaDescription',
            titlePath: 'meta.metaTitle',
          }),
        ]

        let fields: Field[]

        if (pluginOptions.tabbedUI) {
          const firstField = collection.fields[0]
          const firstIsTabsField = firstField?.type === 'tabs'

          // Named tab so data saves under meta.* — consistent with hooks and resolveMeta
          const seoTab = { name: 'meta', fields: seoFields, label: 'SEO' }

          if (firstIsTabsField) {
            // Append SEO tab to the existing tabs field
            const existingTabs = firstField as TabsField
            fields = [
              {
                ...existingTabs,
                tabs: [...existingTabs.tabs, seoTab],
              },
              ...collection.fields.slice(1),
            ]
          } else {
            // Wrap all existing fields in a "Content" tab, add SEO tab
            fields = [
              {
                type: 'tabs' as const,
                tabs: [
                  { fields: collection.fields as Field[], label: 'Content' },
                  seoTab,
                ],
              },
            ]
          }
        } else {
          // Default: append a meta group to the sidebar
          fields = [
            ...collection.fields,
            {
              name: 'meta',
              type: 'group' as const,
              admin: { position: 'sidebar' as const },
              fields: seoFields,
              label: 'SEO',
            },
          ]
        }

        return {
          ...collection,
          endpoints,
          fields,
          hooks: {
            ...collection.hooks,
            afterChange: [...(collection.hooks?.afterChange ?? []), ogImageHook],
            afterRead: [...(collection.hooks?.afterRead ?? []), autoAlternatesHook],
            beforeChange: [...(collection.hooks?.beforeChange ?? []), generateMetaHook],
          },
        }
      })
    }

    // Keep schema consistent even when disabled (important for migrations)
    if (pluginOptions.disabled) {
      return config
    }

    // Seed default JSON-LD templates into global-seo on first run
    const userOnInit = config.onInit
    config.onInit = async (payload) => {
      // Run the user's own onInit first
      if (userOnInit) await userOnInit(payload)

      try {
        const existing = await payload.findGlobal({ slug: 'global-seo' })
        const templates = (existing as Record<string, unknown>)['jsonLdTemplates'] as
          | unknown[]
          | undefined

        // Only seed when no templates have been saved yet
        if (!templates || templates.length === 0) {
          await payload.updateGlobal({
            slug: 'global-seo',
            data: {
              jsonLdTemplates: DEFAULT_JSON_LD_TEMPLATES,
            },
          })
        }
      } catch {
        // global-seo not available yet (e.g. fresh DB before migrations) — skip silently
      }
    }

    return config
  }
