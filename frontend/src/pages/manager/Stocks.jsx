import React from 'react'
import { Package } from 'lucide-react'

function ManagerStocks() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stocks</h1>
        <p className="text-gray-600">Stocks consolidés de vos magasins</p>
      </div>
      <div className="card text-center py-16">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Page en développement</h2>
        <p className="text-gray-600">Affichera les stocks agrégés de tous vos magasins</p>
      </div>
    </div>
  )
}

export default ManagerStocks
