/**
 * Helper functions for user role management
 */

export const COMPANY_ROLES = ['company', 'admin', 'owner', 'manager'] as const
export const CLIENT_ROLES = ['client', 'customer', 'user'] as const

export type CompanyRole = typeof COMPANY_ROLES[number]
export type ClientRole = typeof CLIENT_ROLES[number]
export type UserRole = CompanyRole | ClientRole

/**
 * Check if a role belongs to a company/restaurant
 */
export function isCompanyRole(role?: string): boolean {
  if (!role) return false
  return COMPANY_ROLES.includes(role as any)
}

/**
 * Check if a role belongs to a client/customer
 */
export function isClientRole(role?: string): boolean {
  if (!role) return false
  return CLIENT_ROLES.includes(role as any)
}

/**
 * Get the profile route based on user role
 */
export function getProfileRoute(role?: string): string {
  return isCompanyRole(role) ? '/company-profile' : '/profile'
}
