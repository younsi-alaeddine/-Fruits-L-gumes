import React from 'react'
import { X } from 'lucide-react'

/**
 * Composant modal réutilisable
 */
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-0">
      <div className={`bg-white rounded-lg md:rounded-lg rounded-t-2xl md:rounded-t-lg p-4 md:p-6 w-full mx-0 md:mx-4 max-h-[90vh] md:max-h-[85vh] overflow-y-auto ${sizeClasses[size]} touch-target`}>
        <div className="flex items-center justify-between mb-4 md:mb-6 sticky top-0 bg-white pb-2 border-b border-gray-200 -mx-4 md:-mx-6 px-4 md:px-6">
          {title && <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors touch-target"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
