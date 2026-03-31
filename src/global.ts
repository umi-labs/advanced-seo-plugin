import type { GlobalConfig } from 'payload'

type GlobalSeoOptions = {
  mediaCollection?: string[]
}

export const getGlobalSeoGlobal = (opts: GlobalSeoOptions = {}): GlobalConfig => {
  const mediaRelation = (opts.mediaCollection?.[0] ?? 'media') as 'media'

  return {
    slug: 'global-seo',
    fields: [
      {
        name: 'siteName',
        type: 'text',
        label: 'Site Name',
      },
      {
        name: 'twitterHandle',
        type: 'text',
        label: 'Twitter / X Handle',
      },
      {
        name: 'robots',
        type: 'text',
        admin: {
          description:
            'Override robots meta tag for all pages — useful for staging (e.g. "noindex, nofollow"). Leave blank for production.',
          placeholder: 'noindex, nofollow',
        },
        label: 'Site-wide Robots Directive',
      },
      {
        name: 'defaultTitle',
        type: 'text',
        label: 'Default Meta Title',
      },
      {
        name: 'defaultDescription',
        type: 'textarea',
        label: 'Default Meta Description',
      },
      {
        name: 'defaultImage',
        type: 'upload',
        label: 'Default OG Image',
        relationTo: mediaRelation,
      },
      {
        name: 'autoGenerateAlternates',
        type: 'checkbox',
        defaultValue: false,
        label: 'Auto-generate Hreflang Alternates',
      },
      {
        name: 'enableOgGenerator',
        type: 'checkbox',
        defaultValue: false,
        label: 'Enable OG Image Generator',
      },
      {
        name: 'jsonLdTemplates',
        type: 'array',
        admin: {
          components: {
            RowLabel: '@foundrykit/advanced-seo-plugin/client#JsonLdTemplateRowLabel',
          },
          description:
            'Reusable schema markup templates. The five built-in schema types are seeded automatically — customise them or add your own. Each template can be loaded into any document from the JSON-LD field.',
          initCollapsed: false,
        },
        fields: [
          {
            name: 'name',
            type: 'text',
            label: 'Template Name',
            required: true,
          },
          {
            name: 'template',
            type: 'json',
            admin: {
              components: {
                Field: {
                  clientProps: { isTemplate: true },
                  path: '@foundrykit/advanced-seo-plugin/client#JsonLdEditorComponent',
                },
              },
            },
            label: 'Schema',
          },
        ],
        label: 'JSON-LD Templates',
      },
    ],
    label: 'Global SEO',
  }
}
