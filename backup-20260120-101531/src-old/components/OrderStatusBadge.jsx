import React from 'react'

/**
 * Badge pour afficher le statut d'une commande
 */
function OrderStatusBadge({ status }) {
  const statusConfig = {
    brouillon: {
      label: 'Brouillon',
      className: 'bg-gray-100 text-gray-700',
    },
    envoyée: {
      label: 'Envoyée',
      className: 'bg-blue-100 text-blue-700',
    },
    confirmée: {
      label: 'Confirmée',
      className: 'bg-yellow-100 text-yellow-700',
    },
    en_préparation: {
      label: 'En préparation',
      className: 'bg-orange-100 text-orange-700',
    },
    prête: {
      label: 'Prête',
      className: 'bg-green-100 text-green-700',
    },
    livrée: {
      label: 'Livrée',
      className: 'bg-teal-100 text-teal-700',
    },
    annulée: {
      label: 'Annulée',
      className: 'bg-red-100 text-red-700',
    },
  }

  const config = statusConfig[status] || statusConfig.brouillon

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}

export default OrderStatusBadge
