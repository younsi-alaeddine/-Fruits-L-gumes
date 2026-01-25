import { useState, useCallback } from 'react'

/**
 * Hook pour gérer les notifications toast
 */
export function useToast() {
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' })

  const showToast = useCallback((message, type = 'info') => {
    setToast({ isOpen: true, message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const showSuccess = useCallback((message) => {
    showToast(message, 'success')
  }, [showToast])

  const showError = useCallback((message) => {
    showToast(message, 'error')
  }, [showToast])

  const showInfo = useCallback((message) => {
    showToast(message, 'info')
  }, [showToast])

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo,
  }
}
