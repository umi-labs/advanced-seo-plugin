'use client'

import type { JSONFieldClientComponent } from 'payload'

import { useConfig, useField } from '@payloadcms/ui'
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SchemaType = 'Article' | 'BreadcrumbList' | 'None' | 'Organization' | 'Product' | 'WebPage'

type BreadcrumbItem = { id: string; name: string }

type FormState = {
  // Article
  articleAuthorName: string
  articleAuthorUrl: string
  articleBody: string
  articleDateModified: string
  articleDatePublished: string
  articleDescription: string
  articleHeadline: string
  articleImage: string
  articlePublisherLogo: string
  articlePublisherName: string
  articleUrl: string
  // BreadcrumbList
  breadcrumbItems: BreadcrumbItem[]
  // Organization
  orgDescription: string
  orgEmail: string
  orgLogo: string
  orgName: string
  orgSameAs: string // newline-separated
  orgTelephone: string
  orgUrl: string
  // Product
  productBrand: string
  productDescription: string
  productImage: string
  productName: string
  productOffersAvailability: string
  productOffersCurrency: string
  productOffersPrice: string
  productOffersUrl: string
  productSku: string
  productUrl: string
  // WebPage
  webBreadcrumb: string
  webDateModified: string
  webDatePublished: string
  webDescription: string
  webImage: string
  webName: string
  webUrl: string
}

type State = FormState & { schemaType: SchemaType }

type Action =
  | { field: keyof FormState; type: 'SET_FIELD'; value: string }
  | { index: number; key: keyof BreadcrumbItem; type: 'SET_BREADCRUMB'; value: string }
  | { type: 'ADD_BREADCRUMB' }
  | { index: number; type: 'REMOVE_BREADCRUMB' }
  | { type: 'SET_SCHEMA'; value: SchemaType }
  | { type: 'LOAD_TEMPLATE'; value: Record<string, unknown> }

// ---------------------------------------------------------------------------
// Helpers to build JSON-LD from form state
// ---------------------------------------------------------------------------

function buildJsonLd(state: State): Record<string, unknown> | null {
  if (state.schemaType === 'None') return null

  const base = { '@context': 'https://schema.org', '@type': state.schemaType }

  if (state.schemaType === 'WebPage') {
    return {
      ...base,
      ...(state.webName && { name: state.webName }),
      ...(state.webUrl && { url: state.webUrl }),
      ...(state.webDescription && { description: state.webDescription }),
      ...(state.webImage && { image: state.webImage }),
      ...(state.webDatePublished && { datePublished: state.webDatePublished }),
      ...(state.webDateModified && { dateModified: state.webDateModified }),
      ...(state.webBreadcrumb && { breadcrumb: state.webBreadcrumb }),
    }
  }

  if (state.schemaType === 'Article') {
    return {
      ...base,
      ...(state.articleHeadline && { headline: state.articleHeadline }),
      ...(state.articleUrl && { url: state.articleUrl }),
      ...(state.articleDescription && { description: state.articleDescription }),
      ...(state.articleImage && { image: state.articleImage }),
      ...(state.articleDatePublished && { datePublished: state.articleDatePublished }),
      ...(state.articleDateModified && { dateModified: state.articleDateModified }),
      ...(state.articleBody && { articleBody: state.articleBody }),
      ...(state.articleAuthorName && {
        author: {
          '@type': 'Person',
          name: state.articleAuthorName,
          ...(state.articleAuthorUrl && { url: state.articleAuthorUrl }),
        },
      }),
      ...(state.articlePublisherName && {
        publisher: {
          '@type': 'Organization',
          name: state.articlePublisherName,
          ...(state.articlePublisherLogo && {
            logo: { '@type': 'ImageObject', url: state.articlePublisherLogo },
          }),
        },
      }),
    }
  }

  if (state.schemaType === 'Product') {
    const hasOffer =
      state.productOffersPrice ||
      state.productOffersCurrency ||
      state.productOffersAvailability ||
      state.productOffersUrl
    return {
      ...base,
      ...(state.productName && { name: state.productName }),
      ...(state.productUrl && { url: state.productUrl }),
      ...(state.productDescription && { description: state.productDescription }),
      ...(state.productImage && { image: state.productImage }),
      ...(state.productSku && { sku: state.productSku }),
      ...(state.productBrand && { brand: { '@type': 'Brand', name: state.productBrand } }),
      ...(hasOffer && {
        offers: {
          '@type': 'Offer',
          ...(state.productOffersPrice && { price: state.productOffersPrice }),
          ...(state.productOffersCurrency && { priceCurrency: state.productOffersCurrency }),
          ...(state.productOffersAvailability && {
            availability: state.productOffersAvailability,
          }),
          ...(state.productOffersUrl && { url: state.productOffersUrl }),
        },
      }),
    }
  }

  if (state.schemaType === 'Organization') {
    const sameAs = state.orgSameAs
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    return {
      ...base,
      ...(state.orgName && { name: state.orgName }),
      ...(state.orgUrl && { url: state.orgUrl }),
      ...(state.orgDescription && { description: state.orgDescription }),
      ...(state.orgEmail && { email: state.orgEmail }),
      ...(state.orgTelephone && { telephone: state.orgTelephone }),
      ...(state.orgLogo && { logo: { '@type': 'ImageObject', url: state.orgLogo } }),
      ...(sameAs.length > 0 && { sameAs }),
    }
  }

  if (state.schemaType === 'BreadcrumbList') {
    const items = state.breadcrumbItems.filter((i) => i.name && i.id)
    return {
      ...base,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        item: item.id,
        name: item.name,
        position: index + 1,
      })),
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Parse existing JSON-LD value into form state
// ---------------------------------------------------------------------------

function parseJsonLd(value: Record<string, unknown> | null | undefined): State {
  const empty: State = {
    schemaType: 'None',
    articleAuthorName: '',
    articleAuthorUrl: '',
    articleBody: '',
    articleDateModified: '',
    articleDatePublished: '',
    articleDescription: '',
    articleHeadline: '',
    articleImage: '',
    articlePublisherLogo: '',
    articlePublisherName: '',
    articleUrl: '',
    breadcrumbItems: [{ id: '', name: '' }],
    orgDescription: '',
    orgEmail: '',
    orgLogo: '',
    orgName: '',
    orgSameAs: '',
    orgTelephone: '',
    orgUrl: '',
    productBrand: '',
    productDescription: '',
    productImage: '',
    productName: '',
    productOffersAvailability: '',
    productOffersCurrency: '',
    productOffersPrice: '',
    productOffersUrl: '',
    productSku: '',
    productUrl: '',
    webBreadcrumb: '',
    webDateModified: '',
    webDatePublished: '',
    webDescription: '',
    webImage: '',
    webName: '',
    webUrl: '',
  }

  if (!value || typeof value !== 'object') return empty

  const type = value['@type'] as string | undefined
  if (!type) return empty

  if (type === 'WebPage') {
    return {
      ...empty,
      schemaType: 'WebPage',
      webBreadcrumb: (value['breadcrumb'] as string) ?? '',
      webDateModified: (value['dateModified'] as string) ?? '',
      webDatePublished: (value['datePublished'] as string) ?? '',
      webDescription: (value['description'] as string) ?? '',
      webImage: (value['image'] as string) ?? '',
      webName: (value['name'] as string) ?? '',
      webUrl: (value['url'] as string) ?? '',
    }
  }

  if (type === 'Article') {
    const author = value['author'] as Record<string, string> | undefined
    const publisher = value['publisher'] as Record<string, unknown> | undefined
    const logo = publisher?.['logo'] as Record<string, string> | undefined
    return {
      ...empty,
      schemaType: 'Article',
      articleAuthorName: author?.['name'] ?? '',
      articleAuthorUrl: author?.['url'] ?? '',
      articleBody: (value['articleBody'] as string) ?? '',
      articleDateModified: (value['dateModified'] as string) ?? '',
      articleDatePublished: (value['datePublished'] as string) ?? '',
      articleDescription: (value['description'] as string) ?? '',
      articleHeadline: (value['headline'] as string) ?? '',
      articleImage: (value['image'] as string) ?? '',
      articlePublisherLogo: logo?.['url'] ?? '',
      articlePublisherName: (publisher?.['name'] as string) ?? '',
      articleUrl: (value['url'] as string) ?? '',
    }
  }

  if (type === 'Product') {
    const brand = value['brand'] as Record<string, string> | undefined
    const offers = value['offers'] as Record<string, string> | undefined
    return {
      ...empty,
      schemaType: 'Product',
      productBrand: brand?.['name'] ?? '',
      productDescription: (value['description'] as string) ?? '',
      productImage: (value['image'] as string) ?? '',
      productName: (value['name'] as string) ?? '',
      productOffersAvailability: offers?.['availability'] ?? '',
      productOffersCurrency: offers?.['priceCurrency'] ?? '',
      productOffersPrice: offers?.['price'] ?? '',
      productOffersUrl: offers?.['url'] ?? '',
      productSku: (value['sku'] as string) ?? '',
      productUrl: (value['url'] as string) ?? '',
    }
  }

  if (type === 'Organization') {
    const logo = value['logo'] as Record<string, string> | undefined
    const sameAs = value['sameAs'] as string[] | undefined
    return {
      ...empty,
      schemaType: 'Organization',
      orgDescription: (value['description'] as string) ?? '',
      orgEmail: (value['email'] as string) ?? '',
      orgLogo: logo?.['url'] ?? '',
      orgName: (value['name'] as string) ?? '',
      orgSameAs: sameAs?.join('\n') ?? '',
      orgTelephone: (value['telephone'] as string) ?? '',
      orgUrl: (value['url'] as string) ?? '',
    }
  }

  if (type === 'BreadcrumbList') {
    const items = value['itemListElement'] as Array<Record<string, string>> | undefined
    return {
      ...empty,
      schemaType: 'BreadcrumbList',
      breadcrumbItems:
        items && items.length > 0
          ? items.map((i) => ({ id: i['item'] ?? '', name: i['name'] ?? '' }))
          : [{ id: '', name: '' }],
    }
  }

  return empty
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SCHEMA':
      return { ...state, schemaType: action.value }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'SET_BREADCRUMB': {
      const items = state.breadcrumbItems.map((item, i) =>
        i === action.index ? { ...item, [action.key]: action.value } : item,
      )
      return { ...state, breadcrumbItems: items }
    }
    case 'ADD_BREADCRUMB':
      return { ...state, breadcrumbItems: [...state.breadcrumbItems, { id: '', name: '' }] }
    case 'REMOVE_BREADCRUMB':
      return {
        ...state,
        breadcrumbItems:
          state.breadcrumbItems.length > 1
            ? state.breadcrumbItems.filter((_, i) => i !== action.index)
            : state.breadcrumbItems,
      }
    case 'LOAD_TEMPLATE':
      return parseJsonLd(action.value)
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Shared input styles
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  background: 'var(--theme-elevation-0)',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 4,
  color: 'var(--theme-text)',
  fontFamily: 'inherit',
  fontSize: 13,
  padding: '6px 10px',
  width: '100%',
}

const labelStyle: React.CSSProperties = {
  color: 'var(--theme-elevation-800)',
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 4,
}

const hintStyle: React.CSSProperties = {
  color: 'var(--theme-elevation-500)',
  fontSize: 11,
  marginTop: 2,
}

const sectionStyle: React.CSSProperties = {
  borderTop: '1px solid var(--theme-elevation-100)',
  marginTop: 16,
  paddingTop: 16,
}

const sectionLabelStyle: React.CSSProperties = {
  color: 'var(--theme-elevation-500)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  marginBottom: 12,
  textTransform: 'uppercase',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: '1fr 1fr',
}

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

function Field({
  dispatch,
  field,
  hint,
  label,
  placeholder,
  state,
  textarea,
}: {
  dispatch: React.Dispatch<Action>
  field: keyof FormState
  hint?: string
  label: string
  placeholder?: string
  state: State
  textarea?: boolean
}) {
  const value = state[field] as string
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    dispatch({ field, type: 'SET_FIELD', value: e.target.value })

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {textarea ? (
        <textarea
          onChange={handleChange}
          placeholder={placeholder}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          value={value}
        />
      ) : (
        <input onChange={handleChange} placeholder={placeholder} style={inputStyle} value={value} />
      )}
      {hint && <div style={hintStyle}>{hint}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Schema-specific forms
// ---------------------------------------------------------------------------

function WebPageForm({ dispatch, state }: { dispatch: React.Dispatch<Action>; state: State }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={gridStyle}>
        <Field dispatch={dispatch} field="webName" label="Page Name" state={state} />
        <Field
          dispatch={dispatch}
          field="webUrl"
          hint="Full URL, e.g. https://example.com/page"
          label="Page URL"
          state={state}
        />
      </div>
      <Field
        dispatch={dispatch}
        field="webDescription"
        label="Description"
        state={state}
        textarea
      />
      <div style={gridStyle}>
        <Field
          dispatch={dispatch}
          field="webImage"
          hint="Absolute URL of the featured image"
          label="Image URL"
          state={state}
        />
        <Field dispatch={dispatch} field="webBreadcrumb" label="Breadcrumb" state={state} />
      </div>
      <div style={gridStyle}>
        <Field
          dispatch={dispatch}
          field="webDatePublished"
          hint="ISO 8601, e.g. 2024-01-15"
          label="Date Published"
          placeholder="2024-01-15"
          state={state}
        />
        <Field
          dispatch={dispatch}
          field="webDateModified"
          hint="ISO 8601, e.g. 2024-06-01"
          label="Date Modified"
          placeholder="2024-06-01"
          state={state}
        />
      </div>
    </div>
  )
}

function ArticleForm({ dispatch, state }: { dispatch: React.Dispatch<Action>; state: State }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Field
        dispatch={dispatch}
        field="articleHeadline"
        hint="Max 110 characters recommended"
        label="Headline"
        state={state}
      />
      <div style={gridStyle}>
        <Field dispatch={dispatch} field="articleUrl" label="Article URL" state={state} />
        <Field
          dispatch={dispatch}
          field="articleImage"
          hint="Absolute URL of the featured image"
          label="Image URL"
          state={state}
        />
      </div>
      <Field
        dispatch={dispatch}
        field="articleDescription"
        label="Description"
        state={state}
        textarea
      />
      <div style={gridStyle}>
        <Field
          dispatch={dispatch}
          field="articleDatePublished"
          hint="ISO 8601, e.g. 2024-01-15"
          label="Date Published"
          placeholder="2024-01-15"
          state={state}
        />
        <Field
          dispatch={dispatch}
          field="articleDateModified"
          hint="ISO 8601, e.g. 2024-06-01"
          label="Date Modified"
          placeholder="2024-06-01"
          state={state}
        />
      </div>

      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Author</div>
        <div style={gridStyle}>
          <Field dispatch={dispatch} field="articleAuthorName" label="Author Name" state={state} />
          <Field dispatch={dispatch} field="articleAuthorUrl" label="Author URL" state={state} />
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Publisher</div>
        <div style={gridStyle}>
          <Field
            dispatch={dispatch}
            field="articlePublisherName"
            label="Publisher Name"
            state={state}
          />
          <Field
            dispatch={dispatch}
            field="articlePublisherLogo"
            hint="Absolute URL of the logo image"
            label="Publisher Logo URL"
            state={state}
          />
        </div>
      </div>
    </div>
  )
}

function ProductForm({ dispatch, state }: { dispatch: React.Dispatch<Action>; state: State }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={gridStyle}>
        <Field dispatch={dispatch} field="productName" label="Product Name" state={state} />
        <Field dispatch={dispatch} field="productBrand" label="Brand" state={state} />
      </div>
      <Field
        dispatch={dispatch}
        field="productDescription"
        label="Description"
        state={state}
        textarea
      />
      <div style={gridStyle}>
        <Field dispatch={dispatch} field="productSku" label="SKU" state={state} />
        <Field dispatch={dispatch} field="productUrl" label="Product URL" state={state} />
      </div>
      <Field
        dispatch={dispatch}
        field="productImage"
        hint="Absolute URL of the product image"
        label="Image URL"
        state={state}
      />

      <div style={sectionStyle}>
        <div style={sectionLabelStyle}>Offer</div>
        <div style={gridStyle}>
          <Field dispatch={dispatch} field="productOffersPrice" label="Price" placeholder="29.99" state={state} />
          <Field
            dispatch={dispatch}
            field="productOffersCurrency"
            hint="ISO 4217, e.g. USD, GBP, EUR"
            label="Currency"
            placeholder="USD"
            state={state}
          />
        </div>
        <div style={{ ...gridStyle, marginTop: 12 }}>
          <Field
            dispatch={dispatch}
            field="productOffersAvailability"
            hint="e.g. InStock, OutOfStock, PreOrder"
            label="Availability"
            placeholder="InStock"
            state={state}
          />
          <Field dispatch={dispatch} field="productOffersUrl" label="Offer URL" state={state} />
        </div>
      </div>
    </div>
  )
}

function OrganizationForm({
  dispatch,
  state,
}: {
  dispatch: React.Dispatch<Action>
  state: State
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={gridStyle}>
        <Field dispatch={dispatch} field="orgName" label="Organization Name" state={state} />
        <Field dispatch={dispatch} field="orgUrl" label="Website URL" state={state} />
      </div>
      <Field
        dispatch={dispatch}
        field="orgDescription"
        label="Description"
        state={state}
        textarea
      />
      <div style={gridStyle}>
        <Field dispatch={dispatch} field="orgEmail" label="Email" state={state} />
        <Field dispatch={dispatch} field="orgTelephone" label="Telephone" state={state} />
      </div>
      <Field
        dispatch={dispatch}
        field="orgLogo"
        hint="Absolute URL of the organization logo"
        label="Logo URL"
        state={state}
      />
      <Field
        dispatch={dispatch}
        field="orgSameAs"
        hint="One URL per line — links to social profiles or other authoritative pages"
        label="Same As URLs"
        state={state}
        textarea
      />
    </div>
  )
}

function BreadcrumbForm({
  dispatch,
  state,
}: {
  dispatch: React.Dispatch<Action>
  state: State
}) {
  return (
    <div>
      {state.breadcrumbItems.map((item, index) => (
        <div
          key={index}
          style={{
            alignItems: 'flex-end',
            display: 'grid',
            gap: 10,
            gridTemplateColumns: '1fr 2fr auto',
            marginBottom: 10,
          }}
        >
          <div>
            <label style={labelStyle}>Name</label>
            <input
              onChange={(e) =>
                dispatch({ index, key: 'name', type: 'SET_BREADCRUMB', value: e.target.value })
              }
              placeholder="Home"
              style={inputStyle}
              value={item.name}
            />
          </div>
          <div>
            <label style={labelStyle}>URL</label>
            <input
              onChange={(e) =>
                dispatch({ index, key: 'id', type: 'SET_BREADCRUMB', value: e.target.value })
              }
              placeholder="https://example.com"
              style={inputStyle}
              value={item.id}
            />
          </div>
          <button
            disabled={state.breadcrumbItems.length <= 1}
            onClick={() => dispatch({ index, type: 'REMOVE_BREADCRUMB' })}
            style={{
              background: 'none',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 4,
              color:
                state.breadcrumbItems.length <= 1
                  ? 'var(--theme-elevation-300)'
                  : 'var(--theme-elevation-600)',
              cursor: state.breadcrumbItems.length <= 1 ? 'default' : 'pointer',
              fontSize: 13,
              padding: '6px 10px',
            }}
            title="Remove"
            type="button"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        onClick={() => dispatch({ type: 'ADD_BREADCRUMB' })}
        style={{
          background: 'none',
          border: '1px solid var(--theme-elevation-200)',
          borderRadius: 4,
          color: 'var(--theme-elevation-700)',
          cursor: 'pointer',
          fontSize: 12,
          marginTop: 4,
          padding: '5px 12px',
        }}
        type="button"
      >
        + Add item
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Schema type picker
// ---------------------------------------------------------------------------

const SCHEMA_TYPES: { description: string; label: string; value: SchemaType }[] = [
  { description: 'No schema markup', label: 'None', value: 'None' },
  { description: 'A generic web page', label: 'Web Page', value: 'WebPage' },
  { description: 'A news or blog article', label: 'Article', value: 'Article' },
  { description: 'A product listing', label: 'Product', value: 'Product' },
  { description: 'A company or brand', label: 'Organization', value: 'Organization' },
  { description: 'Navigational breadcrumbs', label: 'Breadcrumb Trail', value: 'BreadcrumbList' },
]

// ---------------------------------------------------------------------------
// Types for saved template entries
// ---------------------------------------------------------------------------

type TemplateEntry = { name: string; template: Record<string, unknown> }

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type JsonLdEditorProps = {
  /** Set to true when this instance is inside the Global SEO jsonLdTemplates array.
   *  Suppresses the "Load template" UI to avoid infinite nesting. */
  isTemplate?: boolean
}

export const JsonLdEditorComponent: JSONFieldClientComponent = (props) => {
  const { path } = props
  const isTemplate = (props as unknown as JsonLdEditorProps).isTemplate ?? false
  const { setValue, value } = useField<Record<string, unknown>>({ path })
  const { config } = useConfig()

  const [state, dispatch] = useReducer(reducer, value as Record<string, unknown> | undefined, (v) =>
    parseJsonLd(v as Record<string, unknown>),
  )

  const [templates, setTemplates] = useState<TemplateEntry[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const didFetch = useRef(false)

  // Fetch templates from global-seo once (only when not in template-editing mode)
  useEffect(() => {
    if (isTemplate || didFetch.current) return
    didFetch.current = true

    const serverURL = config.serverURL ?? ''
    fetch(`${serverURL}/api/globals/global-seo?depth=0`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Record<string, unknown> | null) => {
        if (!data) return
        const entries = data['jsonLdTemplates'] as TemplateEntry[] | undefined
        if (Array.isArray(entries) && entries.length > 0) {
          setTemplates(entries.filter((e) => e.name && e.template))
        }
      })
      .catch(() => {
        // Global SEO not configured yet — silently ignore
      })
  }, [isTemplate, config.serverURL])

  // Sync state → field value whenever form state changes
  useEffect(() => {
    const jsonLd = buildJsonLd(state)
    setValue(jsonLd ?? {})
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadTemplate = useCallback(() => {
    if (!selectedTemplate) return
    const entry = templates.find((t) => t.name === selectedTemplate)
    if (entry?.template) {
      dispatch({ type: 'LOAD_TEMPLATE', value: entry.template })
      setSelectedTemplate('')
    }
  }, [selectedTemplate, templates])

  const activeType = SCHEMA_TYPES.find((t) => t.value === state.schemaType)

  return (
    <div style={{ paddingTop: 16, width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        {!isTemplate && (
          <label style={{ ...labelStyle, fontSize: 13, marginBottom: 8 }}>
            JSON-LD Structured Data
          </label>
        )}
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: 12, margin: '0 0 12px' }}>
          {isTemplate
            ? 'Define the schema markup for this template.'
            : 'Add schema markup to help search engines understand this page. Choose a type below, or load a saved template.'}
        </p>

        {/* Load template bar — only in document context */}
        {!isTemplate && templates.length > 0 && (
          <div
            style={{
              alignItems: 'center',
              background: 'var(--theme-elevation-50, var(--theme-elevation-0))',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 6,
              display: 'flex',
              gap: 8,
              marginBottom: 12,
              padding: '8px 10px',
            }}
          >
            <span style={{ color: 'var(--theme-elevation-600)', fontSize: 12, whiteSpace: 'nowrap' }}>
              Load template:
            </span>
            <select
              onChange={(e) => setSelectedTemplate(e.target.value)}
              style={{
                ...inputStyle,
                flex: 1,
                padding: '4px 8px',
              }}
              value={selectedTemplate}
            >
              <option value="">— choose a template —</option>
              {templates.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              disabled={!selectedTemplate}
              onClick={handleLoadTemplate}
              style={{
                background: selectedTemplate ? 'var(--theme-text)' : 'var(--theme-elevation-200)',
                border: 'none',
                borderRadius: 4,
                color: selectedTemplate ? 'var(--theme-bg)' : 'var(--theme-elevation-400)',
                cursor: selectedTemplate ? 'pointer' : 'default',
                fontFamily: 'inherit',
                fontSize: 12,
                padding: '5px 14px',
                whiteSpace: 'nowrap',
              }}
              type="button"
            >
              Apply
            </button>
          </div>
        )}

        {/* Schema type selector */}
        <div
          style={{
            display: 'grid',
            gap: 8,
            gridTemplateColumns: 'repeat(3, 1fr)',
          }}
        >
          {SCHEMA_TYPES.map((t) => {
            const isSelected = state.schemaType === t.value
            return (
              <button
                key={t.value}
                onClick={() => dispatch({ type: 'SET_SCHEMA', value: t.value })}
                style={{
                  background: isSelected
                    ? 'var(--theme-success-500, #27ae60)'
                    : 'var(--theme-elevation-0)',
                  border: `1px solid ${isSelected ? 'var(--theme-success-500, #27ae60)' : 'var(--theme-elevation-200)'}`,
                  borderRadius: 6,
                  color: isSelected ? '#fff' : 'var(--theme-elevation-800)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  padding: '8px 10px',
                  textAlign: 'left',
                  transition: 'all 0.1s ease',
                }}
                type="button"
              >
                <div style={{ fontWeight: 600 }}>{t.label}</div>
                <div
                  style={{
                    color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--theme-elevation-500)',
                    fontSize: 10,
                    marginTop: 2,
                  }}
                >
                  {t.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Schema form */}
      {state.schemaType !== 'None' && (
        <div
          style={{
            background: 'var(--theme-elevation-50, var(--theme-elevation-0))',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 6,
            padding: 16,
          }}
        >
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>{activeType?.label} Schema</span>
            <a
              href={`https://schema.org/${state.schemaType}`}
              rel="noopener noreferrer"
              style={{ color: 'var(--theme-elevation-500)', fontSize: 11 }}
              target="_blank"
            >
              schema.org/{state.schemaType} ↗
            </a>
          </div>

          {state.schemaType === 'WebPage' && <WebPageForm dispatch={dispatch} state={state} />}
          {state.schemaType === 'Article' && <ArticleForm dispatch={dispatch} state={state} />}
          {state.schemaType === 'Product' && <ProductForm dispatch={dispatch} state={state} />}
          {state.schemaType === 'Organization' && (
            <OrganizationForm dispatch={dispatch} state={state} />
          )}
          {state.schemaType === 'BreadcrumbList' && (
            <BreadcrumbForm dispatch={dispatch} state={state} />
          )}
        </div>
      )}
    </div>
  )
}
