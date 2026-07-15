import { format, parseISO } from 'date-fns'
import type { PgTimestamp, PgUUID } from '@/types/api'

/** Backend money fields are integer minor units (kobo). */
export function formatMoney(minor: number, currency = 'NGN'): string {
  const major = minor / 100
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(major)
  } catch {
    return `${currency} ${major.toLocaleString()}`
  }
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  try {
    return format(parseISO(value), 'MMM d, yyyy')
  } catch {
    return value
  }
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  try {
    return format(parseISO(value), 'MMM d, yyyy · h:mm a')
  } catch {
    return value
  }
}

/** pgtype.UUID serialises as { Bytes, Valid } or a plain string. */
export function uuidToString(value: string | PgUUID | undefined | null): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (!value.Valid || !value.Bytes) return ''
  const hex = value.Bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
  if (hex.length !== 32) return ''
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function pgTimestampToString(value?: PgTimestamp): string | null {
  if (!value || !value.Valid) return null
  return value.Time
}

export function initials(first?: string, last?: string): string {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?'
}
