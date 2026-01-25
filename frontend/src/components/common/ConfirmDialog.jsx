import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

/**
 * Composant de dialogue de confirmation
 * 
 * @param {object} props
 * @param {boolean} props.isOpen - État d'ouverture
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Function} props.onConfirm - Callback de confirmation
 * @param {string} props.title - Titre de la confirmation
 * @param {string} props.message - Message de confirmation
 * @param {string} props.confirmText - Texte du bouton de confirmation
 * @param {string} props.cancelText - Texte du bouton d'annulation
 * @param {string} props.type - Type (danger, warning, info)
 */
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer l\'action',
  message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger',
}) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const typeClasses = {
    danger: {
      icon: 'text-red-600',
      button: 'btn-danger',
    },
    warning: {
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  }

  const colors = typeClasses[type] || typeClasses.danger

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" closeOnOverlayClick={false}>
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className={`flex-shrink-0 p-2 bg-${type}-50 rounded-lg`}>
            <AlertTriangle className={`h-6 w-6 ${colors.icon}`} />
          </div>
          <p className="text-gray-700 flex-1">{message}</p>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button onClick={onClose} className="btn btn-secondary">
            {cancelText}
          </button>
          <button onClick={handleConfirm} className={`btn ${colors.button}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
