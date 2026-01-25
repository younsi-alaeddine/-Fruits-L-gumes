import React, { useState, useEffect } from 'react'
import { Package, Calendar, ShoppingCart, CheckCircle, ArrowRight, Users } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import { getOrders, aggregateOrders } from '../../api/orders'
import { getSuppliers } from '../../api/suppliers'

/**
 * Page d'agrégation des commandes - ADMIN
 * Permet d'agréger les commandes NEW par date de livraison
 */
function OrdersAggregate() {
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [aggregating, setAggregating] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [aggregatedData, setAggregatedData] = useState(null)

  useEffect(() => {
    loadNewOrders()
  }, [])

  const loadNewOrders = async () => {
    try {
      setLoading(true)
      const res = await getOrders({ status: 'NEW' })
      setOrders(res?.orders || [])
    } catch (error) {
      showError('Erreur lors du chargement des commandes')
    } finally {
      setLoading(false)
    }
  }

  const handleAggregate = async () => {
    if (!deliveryDate) {
      showError('Veuillez sélectionner une date de livraison')
      return
    }

    try {
      setAggregating(true)
      const result = await aggregateOrders(deliveryDate)
      setAggregatedData(result.data)
      showSuccess(`${result.data.ordersCount} commande(s) agrégée(s) avec succès`)
      await loadNewOrders() // Recharger pour voir les changements
    } catch (error) {
      showError('Erreur lors de l\'agrégation')
      console.error(error)
    } finally {
      setAggregating(false)
    }
  }

  // Grouper les commandes par date de livraison
  const ordersByDeliveryDate = orders.reduce((acc, order) => {
    const date = order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : 'Sans date'
    if (!acc[date]) acc[date] = []
    acc[date].push(order)
    return acc
  }, {})

  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateString = maxDate.toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          Agrégation des Commandes
        </h1>
        <p className="text-gray-600">Agrégez les commandes NEW par date de livraison pour créer des commandes fournisseur</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <p className="text-xs text-gray-600 font-medium">Commandes NEW</p>
          <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <p className="text-xs text-gray-600 font-medium">Dates de livraison</p>
          <p className="text-3xl font-bold text-purple-600">{Object.keys(ordersByDeliveryDate).length}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <p className="text-xs text-gray-600 font-medium">Total produits</p>
          <p className="text-3xl font-bold text-green-600">
            {orders.reduce((sum, o) => sum + (o.items?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Agrégation */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Package className="h-5 w-5 text-primary-600" />
          <span>Agréger les commandes</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date de livraison
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={today}
              max={maxDateString}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAggregate}
              disabled={!deliveryDate || aggregating}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {aggregating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Agrégation...</span>
                </>
              ) : (
                <>
                  <Package className="h-5 w-5" />
                  <span>Agréger</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Résultat de l'agrégation */}
      {aggregatedData && (
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Agrégation réussie</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Commandes agrégées</p>
              <p className="text-2xl font-bold text-gray-900">{aggregatedData.ordersCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Produits uniques</p>
              <p className="text-2xl font-bold text-gray-900">{aggregatedData.aggregatedItems?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date de livraison</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(aggregatedData.deliveryDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <button
                onClick={() => window.location.href = '/admin/orders'}
                className="btn-primary w-full"
              >
                Voir les commandes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commandes par date de livraison */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary-600" />
          <span>Commandes NEW par date de livraison</span>
        </h2>

        {Object.keys(ordersByDeliveryDate).length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune commande NEW trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(ordersByDeliveryDate).map(([date, dateOrders]) => (
              <div key={date} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="font-bold text-gray-900">
                        {date === 'Sans date' ? 'Sans date' : new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600">{dateOrders.length} commande(s)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDeliveryDate(date === 'Sans date' ? '' : date)
                      handleAggregate()
                    }}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Package className="h-4 w-4" />
                    <span>Agréger</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Total produits: </span>
                    <span className="font-semibold">
                      {dateOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total HT: </span>
                    <span className="font-semibold">
                      {dateOrders.reduce((sum, o) => sum + (o.totalHT || 0), 0).toFixed(2)} €
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Magasins: </span>
                    <span className="font-semibold">
                      {new Set(dateOrders.map(o => o.shopId)).size}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersAggregate
