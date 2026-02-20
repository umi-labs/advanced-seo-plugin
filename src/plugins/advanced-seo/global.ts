export const getGlobalSeoGlobal = () => ({
  slug: 'global-seo',
  label: 'Global SEO',
  fields: [
    { name: 'siteName', type: 'text' },
    { name: 'twitterHandle', type: 'text' },
    { name: 'defaultTitle', type: 'text' },
    { name: 'defaultDescription', type: 'textarea' },
    { name: 'mediaCollection', type: 'array', fields: [{ name: 'relationTo', type: 'text' }] },
    { name: 'autoGenerateAlternates', type: 'checkbox' },
    { name: 'enableOgGenerator', type: 'checkbox' },
    { name: 'jsonLdTemplates', type: 'array', fields: [{ name: 'name', type: 'text' }, { name: 'template', type: 'textarea' }] },
  ],
});
