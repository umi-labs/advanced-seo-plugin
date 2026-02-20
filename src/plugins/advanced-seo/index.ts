/* Advanced SEO plugin fields with admin components wired for preview and JSON-LD editing */
import { PreviewPanel, JsonLdEditor } from './admin';
import React from 'react';

export const OverviewField = (opts: any = {}) => ({
  name: opts.name || 'overview',
  type: 'row',
  admin: { components: { Field: () => null } },
  ...opts,
});

export const MetaTitleField = (opts: any = {}) => ({
  name: opts.name || 'title',
  label: opts.label || 'Meta Title',
  type: 'text',
  ...opts,
});

export const MetaImageField = (opts: any = {}) => ({
  name: opts.name || 'image',
  label: opts.label || 'Meta Image',
  relationTo: opts.relationTo || 'media',
  type: 'upload',
  ...opts,
});

export const MetaDescriptionField = (opts: any = {}) => ({
  name: opts.name || 'description',
  label: opts.label || 'Meta Description',
  type: 'textarea',
  ...opts,
});

// PreviewField renders a small admin component to preview title/description/image
export const PreviewField = (opts: any = {}) => ({
  name: opts.name || 'preview',
  type: 'row',
  admin: {
    components: {
      Field: (props: any) => {
        // payload passes the entire sibling data via props?.siblingData or props?.value depending on setup
        const value = props?.value || props?.siblingData || {};
        const title = value?.title || (props?.doc && props.doc.title) || '';
        const description = value?.description || '';
        const image = (value?.image && (value.image.url || value.image)) || '';
        return React.createElement(PreviewPanel, { title, description, image });
      },
    },
  },
  ...opts,
});

export const structuredDataRow = {
  name: 'structuredDataRow',
  type: 'row',
  fields: [
    {
      name: 'jsonLd',
      label: 'JSON-LD',
      type: 'json',
      admin: {
        components: {
          Field: JsonLdEditor,
        },
      },
    },
  ],
} as const;

export const seoPlugin = (opts: any = {}) => ({
  name: 'advanced-seo',
  options: opts,
  // Do not expose a `fields` property here (would be non-iterable in admin).
  fieldFactories: {
    OverviewField,
    MetaTitleField,
    MetaImageField,
    MetaDescriptionField,
    PreviewField,
    structuredDataRow,
  },
});

export default seoPlugin;

export const advancedSeoPlugin = seoPlugin;
