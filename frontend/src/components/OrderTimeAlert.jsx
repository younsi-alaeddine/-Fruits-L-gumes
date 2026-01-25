import React, { useState, useEffect } from 'react'
import { Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { isOrderTimeAllowed, getRemainingOrderTime } from '../utils/orderTimeValidation'

/**
 * Composant d'alerte pour afficher les horaires de commande
 * Bloque la création de commande si hors plage horaire (12h-20h)
 */
function OrderTimeAlert({ role = 'SHOP' }) {
  const [timeStatus, setTimeStatus] = useState(isOrderTimeAllowed())
  const [remainingTime, setRemainingTime] = useState(getRemainingOrderTime())

  useEffect(() => {
    // Mettre à jour toutes les minutes
    const interval = setInterval(() => {
      setTimeStatus(isOrderTimeAllowed())
      setRemainingTime(getRemainingOrderTime())
    }, 60000) // 60 secondes

    return () => clearInterval(interval)
  }, [])

  if (role === 'ADMIN') {
    // ADMIN n'a pas de restriction horaire
    return (
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 mb-6 animate-scale-in">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 mb-1">📋 Réception des commandes</h3>
            <p className="text-sm text-blue-700">
              Vous recevez les commandes des magasins <strong>à partir de 00h00 chaque jour</strong>.
              Les commandes passées hier sont maintenant visibles.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (timeStatus.allowed) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4 mb-6 animate-scale-in">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-green-500 rounded-lg animate-pulse">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-green-900">✅ Commandes OUVERTES</h3>
              <span className="px-3 py-1 bg-green-200 text-green-800 text-xs font-bold rounded-full">
                {remainingTime}
              </span>
            </div>
            <p className="text-sm text-green-700">
              {timeStatus.message}
            </p>
            <p className="text-xs text-green-600 mt-2">
              💡 <strong>Conseil</strong> : Passez vos commandes avant 20h00 pour une réception optimale demain entre 10h-12h.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4 mb-6 animate-scale-in">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-red-500 rounded-lg">
          <AlertCircle className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-red-900 mb-1">🔒 Commandes FERMÉES</h3>
          <p className="text-sm text-red-700 mb-2">
            {timeStatus.message}
          </p>
          <div className="bg-red-200 rounded-lg p-3 mt-3">
            <p className="text-xs font-bold text-red-900 mb-1">⏰ Horaires de commande :</p>
            <ul className="text-xs text-red-800 space-y-1">
              <li>• <strong>Ouverture</strong> : 12h00</li>
              <li>• <strong>Fermeture</strong> : 20h00</li>
              <li>• <strong>Prochaine ouverture</strong> : {timeStatus.nextAvailableTime}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderTimeAlert
