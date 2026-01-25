import React from 'react'
import { ShoppingCart } from 'lucide-react'

function ManagerOrders() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Commandes</h1>
        <p className="text-gray-600">Toutes les commandes de vos magasins</p>
      </div>
      <div className="card text-center py-16">
        <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Page en développement</h2>
        <p className="text-gray-600">Affichera les commandes de tous vos magasins</p>
      </div>
    </div>
  )
}

export default ManagerOrders
