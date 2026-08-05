import { useState } from 'react'

/**
 * Hook para gerenciar estados de toggle (open/close, show/hide, etc.)
 * @param initialState Estado inicial do toggle
 */
export function useToggle(initialState: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialState)

  const toggle = () => setIsOpen(prev => !prev)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return {
    isOpen,
    toggle,
    open,
    close,
    setIsOpen
  }
}