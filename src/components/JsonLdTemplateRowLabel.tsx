'use client'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

export const JsonLdTemplateRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ name?: string }>()
  const label = data?.name?.trim() || `Template ${(rowNumber ?? 0) + 1}`
  return <span>{label}</span>
}
