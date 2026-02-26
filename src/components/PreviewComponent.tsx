'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

type Props = {
  descriptionPath?: string
  hasGenerateFn?: boolean
  titlePath?: string
}

export const PreviewComponent: React.FC<Props> = ({ descriptionPath, titlePath }) => {
  const title = useFormFields(([fields]) => {
    if (!titlePath) return ''
    return (fields[titlePath]?.value as string) ?? ''
  })

  const description = useFormFields(([fields]) => {
    if (!descriptionPath) return ''
    return (fields[descriptionPath]?.value as string) ?? ''
  })

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 4,
        fontFamily: 'Arial, sans-serif',
        maxWidth: 600,
        padding: 12,
      }}
    >
      <div style={{ color: '#1a0dab', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
        {title || 'Page title'}
      </div>
      <div style={{ color: '#006621', fontSize: 12, marginBottom: 4 }}>
        https://example.com/page-url
      </div>
      <div style={{ color: '#545454', fontSize: 13, lineHeight: 1.4 }}>
        {description || 'Page meta description will appear here.'}
      </div>
    </div>
  )
}
