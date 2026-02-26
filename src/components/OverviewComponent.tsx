'use client'

import { useFormFields } from '@payloadcms/ui'
import React from 'react'

type Props = {
  descriptionPath?: string
  imagePath?: string
  titlePath?: string
}

export const OverviewComponent: React.FC<Props> = ({ descriptionPath, titlePath }) => {
  const title = useFormFields(([fields]) => {
    if (!titlePath) return ''
    return (fields[titlePath]?.value as string) ?? ''
  })

  const description = useFormFields(([fields]) => {
    if (!descriptionPath) return ''
    return (fields[descriptionPath]?.value as string) ?? ''
  })

  const titleLength = title.length
  const descLength = description.length

  return (
    <div
      style={{
        borderBottom: '1px solid var(--theme-elevation-100)',
        marginBottom: 20,
        padding: '12px 0',
      }}
    >
      <div style={{ color: 'var(--theme-elevation-500)', display: 'flex', fontSize: 12, gap: 24 }}>
        <span>
          Title:{' '}
          <strong style={{ color: titleLength < 50 || titleLength > 60 ? '#e53' : 'inherit' }}>
            {titleLength}/50-60
          </strong>
        </span>
        <span>
          Description:{' '}
          <strong style={{ color: descLength < 100 || descLength > 150 ? '#e53' : 'inherit' }}>
            {descLength}/100-150
          </strong>
        </span>
      </div>
    </div>
  )
}
