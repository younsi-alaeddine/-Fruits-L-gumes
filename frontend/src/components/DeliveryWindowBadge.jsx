import React from 'react'
import { Truck, Clock } from 'lucide-react'
import { isInDeliveryWindow } from '../utils/orderTimeValidation'

/**
 * Badge indiquant si on est dans la fenêtre de livraison recommandée (10h-12h)
 */
function DeliveryWindowBadge({ size = 'md', showTime = true }) {
  const { inWindow, message, currentTime } = isInDeliveryWindow()

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  if (inWindow) {
    return (
      <div className={`inline-flex items-center space-x-2 bg-green-100 text-green-800 font-semibold rounded-full ${sizeClasses[size]} border-2 border-green-300`}>
        <Truck className="h-4 w-4 animate-bounce" />
        <span>{message}</span>
        {showTime && <span className="font-mono text-xs bg-green-200 px-2 py-0.5 rounded-full">{currentTime}</span>}
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center space-x-2 bg-orange-100 text-orange-800 font-semibold rounded-full ${sizeClasses[size]} border-2 border-orange-300`}>
      <Clock className="h-4 w-4" />
      <span>{message}</span>
      {showTime && <span className="font-mono text-xs bg-orange-200 px-2 py-0.5 rounded-full">{currentTime}</span>}
    </div>
  )
}

export default DeliveryWindowBadge
