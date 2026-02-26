'use client'

import type { TextFieldClientProps } from 'payload'

import { TextInput, useAllFormFields, useConfig, useDocumentInfo, useField } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

type Props = TextFieldClientProps & {
  hasGenerateFn?: boolean
  max?: number
  min?: number
}

export const MetaTitleComponent: React.FC<Props> = ({
  field,
  hasGenerateFn = false,
  max = 60,
  min = 50,
  path,
  ...rest
}) => {
  const { setValue, value } = useField<string>({ path })
  const { collectionSlug, id } = useDocumentInfo()
  const [fields] = useAllFormFields()
  const { config } = useConfig()
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<null | string>(null)
  const length = (value ?? '').length

  let status: 'good' | 'long' | 'short'
  if (length < min) status = 'short'
  else if (length > max) status = 'long'
  else status = 'good'

  const fillPercent = Math.min((length / max) * 100, 100)

  const handleAutoGenerate = useCallback(async () => {
    if (!collectionSlug) return
    setGenerating(true)
    setGenerateError(null)
    try {
      // Collect current flat form state — top-level fields use plain keys (e.g. "title"),
      // nested fields use dot-notation (e.g. "meta.metaTitle")
      const data: Record<string, unknown> = { id }
      for (const [key, fieldState] of Object.entries(fields)) {
        data[key] = fieldState.value
      }
      const serverURL = config.serverURL ?? ''
      const res = await fetch(`${serverURL}/api/${collectionSlug}/generate-title`, {
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!res.ok) {
        setGenerateError(`Request failed: ${res.status}`)
        return
      }
      const json = (await res.json()) as { title?: string }
      if (json.title) {
        setValue(json.title)
      } else {
        setGenerateError('No title returned — check your site name in Global SEO settings')
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setGenerating(false)
    }
  }, [collectionSlug, config.serverURL, fields, id, setValue])

  // Build the label node — with optional Auto-generate link
  const labelNode = hasGenerateFn ? (
    <span style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
      {field.label as string}
      <span style={{ color: 'var(--theme-elevation-400)', fontWeight: 400 }}>—</span>
      <button
        disabled={generating}
        onClick={handleAutoGenerate}
        style={{
          background: 'none',
          border: 'none',
          color: generating ? 'var(--theme-elevation-400)' : 'var(--theme-text)',
          cursor: generating ? 'default' : 'pointer',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 400,
          padding: 0,
          textDecoration: 'underline',
        }}
        type="button"
      >
        {generating ? 'Generating…' : 'Auto-generate'}
      </button>
    </span>
  ) : (field.label as string)

  return (
    <div style={{ width: '100%' }}>
      <TextInput
        {...(rest as any)}
        field={field}
        label={labelNode as string}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        path={path}
        value={value ?? ''}
      />
      {generateError && (
        <div style={{ color: '#c0392b', fontSize: 11, marginTop: 4 }}>{generateError}</div>
      )}
      <CharCountBar fillPercent={fillPercent} length={length} max={max} min={min} status={status} />
    </div>
  )
}

type BarProps = {
  fillPercent: number
  length: number
  max: number
  min: number
  status: 'good' | 'long' | 'short'
}

const CharCountBar: React.FC<BarProps> = ({ fillPercent, length, max, min, status }) => {
  const isGood = status === 'good'
  const color = isGood ? '#27ae60' : '#c0392b'

  let label: string
  if (status === 'short') label = `${length}/${min}-${max} chars, ${min - length} to go`
  else if (status === 'long') label = `${length}/${min}-${max} chars, ${length - max} too many`
  else label = `${length}/${min}-${max} chars`

  return (
    <div style={{ marginBottom: 12, marginTop: 10 }}>
      <div style={{ alignItems: 'center', display: 'flex', gap: 10, marginBottom: 6 }}>
        <span
          style={{
            background: color,
            borderRadius: 4,
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 10px',
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'short' ? 'Too short' : status === 'long' ? 'Too long' : 'Good'}
        </span>
        <span style={{ color: 'var(--theme-elevation-500)', fontSize: 12 }}>{label}</span>
      </div>
      <div
        style={{
          background: 'var(--theme-elevation-100)',
          borderRadius: 2,
          height: 3,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div
          style={{
            background: color,
            borderRadius: 2,
            height: '100%',
            transition: 'width 0.15s ease',
            width: `${fillPercent}%`,
          }}
        />
      </div>
    </div>
  )
}
