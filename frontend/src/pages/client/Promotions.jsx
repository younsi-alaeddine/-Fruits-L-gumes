import React, { useState, useEffect } from 'react'
import { Tag, Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { getPromotions, deactivatePromotion } from '../../api/promotions'

function Promotions() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPromotions() }, [])

  const loadPromotions = async () => {
    try {
      const res = await getPromotions()
      setPromotions(res.data || [])
    } catch (error) {
      console.error(error)
      setPromotions([])
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type, value) => {
    return type === 'percentage' ? (
      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">-{value}%</span>
    ) : (
      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">-{value}€</span>
    )
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Promotions</h1>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Nouvelle Promotion</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo) => (
          <div key={promo.id} className={`card ${promo.active ? 'border-2 border-green-200' : 'opacity-60'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Tag className={`h-8 w-8 ${promo.active ? 'text-green-500' : 'text-gray-400'}`} />
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{promo.name}</h3>
                  {getTypeBadge(promo.type, promo.value)}
                </div>
              </div>
              {promo.active ? (
                <ToggleRight className="h-6 w-6 text-green-500" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-gray-400" />
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Début :</span>
                <span className="font-medium">{promo.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fin :</span>
                <span className="font-medium">{promo.endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Utilisations :</span>
                <span className="font-bold text-primary-600">{promo.usageCount}</span>
              </div>
            </div>

            {promo.products.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Produits :</p>
                <div className="flex flex-wrap gap-2">
                  {promo.products.map((product, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{product}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-5 w-5" /></button>
              <button onClick={() => deactivatePromotion(promo.id)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg">
                {promo.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
              </button>
              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-5 w-5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Promotions
