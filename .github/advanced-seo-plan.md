# Advanced SEO Plugin — Implementation Plan

Problem statement
- Build an advanced SEO plugin for Payload CMS that extends the existing SEO plugin features to include: full metadata (title, description, images), Open Graph image support (integrated with media collection), alternates/hreflang (manual by default, auto-generation option configurable in Global SEO), JSON-LD schema builders editable in the Admin UI, and a Global SEO collection for defaults.

Goals
- Match the structure and developer ergonomics of the existing Payload SEO plugin so fields can be swapped into existing collections easily.
- Provide a Global SEO collection to set site-wide defaults and options (media collection selection, alternates auto-generation toggle, OG image generator toggle).
- Expose reusable field definitions and admin components that mirror the existing plugin API.
- Support Payload v3+.

Plugin structure and field pattern
- Export a `meta` field group that follows the existing SEO plugin shape so it can be dropped into collection fields exactly like:

{
  name: 'meta',
  label: 'SEO',
  fields: [
    OverviewField({
      titlePath: 'meta.title',
      descriptionPath: 'meta.description',
      imagePath: 'meta.image',
    }),
    MetaTitleField({
      hasGenerateFn: true,
    }),
    MetaImageField({
      relationTo: 'media',
    }),

    MetaDescriptionField({}),

    // Structured Data
    structuredDataRow,

    PreviewField({
      // if the `generateUrl` function is configured
      hasGenerateFn: true,

      // field paths to match the target field for data
      titlePath: 'meta.title',
      descriptionPath: 'meta.description',
    }),
  ],
},

- The plugin will export the field factories (OverviewField, MetaTitleField, MetaImageField, MetaDescriptionField, PreviewField) and structuredDataRow so other collections can import them.

Global SEO collection and options
- Provide a `global-seo` global with fields for siteName, twitterHandle, default title template, default description, default images, alternates settings (manual list + auto-generate toggle), OG image generator toggle, selected media collection (defaults to `media`) and JSON-LD templates storage.
- Alternates: manual-by-default; an "auto-generate alternates" option stored in globals allows constructing alternate URLs from locales and slug fields when enabled.
- OG image generation: optional built-in generator that saves into the configured media collection; enabled/disabled from globals and can use user-provided templates or external hooks.

Plugin installation/config example
- The plugin accepts a configuration option for the media collection name(s). Default suggestion is `['media']`, but this can be overridden during installation, for example:

seoPlugin({
  generateTitle,
  generateURL,
  mediaCollection: ['media'], // default; developer can override
});

JSON-LD
- JSON-LD templates stored in globals and editable via a structured editor in the Admin UI; core templates provided (WebPage, Article, Product, Organization) and plugin exposes registration hook for custom templates.
- No required JSON-LD templates will be pre-seeded by the plugin; the global settings and UI let developers add or import templates as needed.

Defaults & resolution
- Resolution order: explicit document fields -> collection-level overrides -> global-seo defaults -> sensible fallbacks.
- Server-side helpers: resolveMeta(doc, {collection, locale, req}) returns merged meta, alternates, OG image URLs, and JSON-LD.

Admin UX
- Provide React components for image picker (wired to chosen media collection), structured JSON-LD editor, alternates editor, OG preview, and a real-time Preview panel that reflects unsaved changes.

Testing, docs, samples
- Unit tests for merge logic, JSON-LD builder, and OG image generator flow; an example integration in `examples/` demonstrating usage in a sample collection.
- Documentation files placed under `.github/` and `README.md` updates in the repo root with examples and configuration options.

Decisions from user replies
1) OG image generator: include an optional built-in generator that writes to the configured media collection and can be disabled.
2) Alternates: manual by default; auto-generation available and configurable in Global SEO settings.
3) Generated images storage: Payload media collection (user-selectable when configuring the plugin) with default suggestion `['media']`.
4) Payload versions: support v3+.
5) JSON-LD: editable in the Admin UI via structured templates.

Implementation milestones / todos
- scaffold-plugin: Scaffold plugin entry `src/plugins/advanced-seo` and export field factories.
- create-global-seo-collection: Implement `global-seo` global and options UI.
- fields-and-admin-components: Implement OverviewField, MetaTitleField, MetaImageField, MetaDescriptionField, PreviewField, structuredDataRow, JSON-LD editor, alternates editor.
- defaults-merge-logic: Implement resolveMeta helper and on-save hooks; respect global toggles (auto-alternates, OG generator).
- jsonld-builder: Implement templates, editor wiring, and builder utilities.
- open-graph-images: Implement optional OG image generator and media collection integration.
- preview-panel: Admin preview of meta tags, OG tags, and JSON-LD.
- tests-and-examples: Unit tests and example collection + docs inside repo.

Questions (confirmations)
- Acceptable to expose an optional built-in OG generator that writes to the selected media collection? (user already agreed: yes)
- Confirm the default media collection name to suggest in README (default: `media`) or leave blank and require configuration? (Default: `media`, but configurable via `mediaCollection` in plugin config)

Next steps
- Implement scaffold-plugin and create-global-seo-collection first, then fields and merge logic.

---

File updated in .github with the requested mediaCollection config example and note that no JSON-LD templates are pre-seeded.
