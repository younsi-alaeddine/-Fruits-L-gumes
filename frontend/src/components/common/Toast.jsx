import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

/**
 * Composant Toast pour les notifications
 * 
 * @param {object} props
 * @param {boolean} props.isOpen - État d'ouverture
 * @param {Function} props.onClose - Callback de fermeture
 * @param {string} props.message - Message à afficher
 * @param {string} props.type - Type (success, error, info, warning)
 * @param {number} props.duration - Durée d'affichage en ms
 */
function Toast({ isOpen, onClose, message, type = 'info', duration = 4000 }) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-green-500',
      border: 'border-green-600',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-500',
      border: 'border-red-600',
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-yellow-500',
      border: 'border-yellow-600',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-500',
      border: 'border-blue-600',
    },
  }

  const config = typeConfig[type] || typeConfig.info
  const Icon = config.icon

  return (
    <div
      className={`fixed bottom-4 right-4 ${config.bg} text-white px-6 py-4 rounded-xl shadow-xl border-2 ${config.border} flex items-center space-x-3 animate-slide-in-right z-50 min-w-[300px] max-w-md`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="flex-1 font-medium">{message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default Toast
