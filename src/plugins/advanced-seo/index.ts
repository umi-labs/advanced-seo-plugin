/* Minimal scaffold for advanced-seo plugin */

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

export const PreviewField = (opts: any = {}) => ({
  name: opts.name || 'preview',
  type: 'row',
  admin: { components: { Field: () => null } },
  ...opts,
});

export const structuredDataRow = { name: 'structuredDataRow', type: 'row' } as const;

export const seoPlugin = (opts: any = {}) => ({
  name: 'advanced-seo',
  options: opts,
  fields: {
    OverviewField,
    MetaTitleField,
    MetaImageField,
    MetaDescriptionField,
    PreviewField,
    structuredDataRow,
  },
});

export default seoPlugin;
