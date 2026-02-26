'use client'

import type { TextareaFieldClientProps } from 'payload'

import { TextareaInput, useField } from '@payloadcms/ui'
import React from 'react'

type Props = TextareaFieldClientProps & {
  max?: number
  min?: number
}

export const MetaDescriptionComponent: React.FC<Props> = ({
  field,
  max = 150,
  min = 100,
  path,
  ...rest
}) => {
  const { setValue, value } = useField<string>({ path })
  const length = (value ?? '').length

  let status: 'good' | 'long' | 'short'
  if (length < min) status = 'short'
  else if (length > max) status = 'long'
  else status = 'good'

  const fillPercent = Math.min((length / max) * 100, 100)

  return (
    <div style={{ width: '100%' }}>
      <TextareaInput
        {...(rest as any)}
        field={field}
        label={field.label as string}
        onChange={(e) => setValue((e as React.ChangeEvent<HTMLTextAreaElement>).target.value)}
        path={path}
        value={value ?? ''}
      />
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
