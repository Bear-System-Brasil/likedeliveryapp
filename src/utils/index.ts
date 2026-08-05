// Utility functions
export * from './auth-helpers'
export * from './formatter'
// export * from './permissions' // Commented to avoid conflict with auth-helpers (isClient, isRestaurantStaff)
export * from './role-helpers'

// Date utilities
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(relativeTime)
dayjs.locale('pt-br')

export { dayjs }

// Number formatters
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

// String utilities
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}