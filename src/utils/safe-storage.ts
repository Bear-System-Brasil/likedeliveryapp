/**
 * Safe localStorage wrapper that handles quota exceeded errors
 */

export const safeStorage = {
  /**
   * Safely get item from localStorage
   */
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null

    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error)
      return null
    }
  },

  /**
   * Safely set item to localStorage
   * If quota exceeded, tries to clear non-essential data and retry
   */
  setItem(key: string, value: string): boolean {
    if (typeof window === 'undefined') return false

    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error)

      // If quota exceeded, try to free up space
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, attempting to clear non-essential data...')

        try {
          // Remove large temporary data
          localStorage.removeItem('productImages')
          localStorage.removeItem('productCategories')

          // Try again
          localStorage.setItem(key, value)
          console.log('Successfully saved after clearing space')
          return true
        } catch (retryError) {
          console.error('Failed to save even after clearing space:', retryError)
          return false
        }
      }

      return false
    }
  },

  /**
   * Safely remove item from localStorage
   */
  removeItem(key: string): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error)
    }
  },

  /**
   * Clear all localStorage
   */
  clear(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  },

  /**
   * Get localStorage usage info
   */
  getUsageInfo(): { used: number; total: number; percentage: number } | null {
    if (typeof window === 'undefined') return null

    try {
      let total = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length
        }
      }

      // Most browsers have 5-10MB limit
      const limit = 5 * 1024 * 1024 // 5MB

      return {
        used: total,
        total: limit,
        percentage: (total / limit) * 100
      }
    } catch (error) {
      console.error('Error getting storage usage:', error)
      return null
    }
  }
}
