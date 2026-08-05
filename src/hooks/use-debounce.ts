import { useEffect, useState } from 'react'

/**
 * Hook para debounce de valores - evita execuções desnecessárias
 * @param value Valor a ser debounced
 * @param delay Delay em milissegundos
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}