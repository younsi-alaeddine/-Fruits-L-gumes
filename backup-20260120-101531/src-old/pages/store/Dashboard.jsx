import React, { useState, useEffect } from 'react'
import { ShoppingCart, Package, Truck, TrendingUp, AlertCircle, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import { ROUTES } from '../../constants/routes'
import { getOrders } from '../../api/orders'

/**
 * Dashboard MAGASIN - Vue locale du magasin
 */
function StoreDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { activeStore } = useStore()
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingPreparation: 0,
    readyOrders: 0,
    inDelivery: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeStore) {
      loadStats()
    }
  }, [activeStore])

  const loadStats = async () => {
    try {
      setLoading(true)
      const params = {
        storeId: activeStore?.id,
      }
      const ordersRes = await getOrders(params)
      const orders = ordersRes.data || []

      setStats({
        totalOrders: orders.length,
        pendingPreparation: orders.filter((o) => o.status === 'confirmée').length,
        readyOrders: orders.filter((o) => o.status === 'prête').length,
        inDelivery: orders.filter((o) => o.status === 'en_livraison').length,
      })
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!activeStore) {
    return (
      <div className="card text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun magasin sélectionné</h2>
        <p className="text-gray-600">Veuillez sélectionner un magasin pour continuer.</p>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total commandes',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'primary',
      route: ROUTES.STORE.ORDERS,
    },
    {
      title: 'À préparer',
      value: stats.pendingPreparation,
      icon: Package,
      color: 'orange',
      route: ROUTES.STORE.PREPARATION,
    },
    {
      title: 'Prêtes',
      value: stats.readyOrders,
      icon: Package,
      color: 'green',
      route: ROUTES.STORE.ORDERS,
    },
    {
      title: 'En livraison',
      value: stats.inDelivery,
      icon: Truck,
      color: 'blue',
      route: ROUTES.STORE.DELIVERIES,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
        <p className="text-gray-600">Magasin: {activeStore.name}</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const colorClasses = {
            primary: 'from-primary-50 to-primary-100 border-primary-200 text-primary-600',
            blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600',
            green: 'from-green-50 to-green-100 border-green-200 text-green-600',
            orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-600',
          }

          return (
            <div
              key={index}
              onClick={() => navigate(card.route)}
              className={`card bg-gradient-to-r ${colorClasses[card.color]} cursor-pointer hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                </div>
                <Icon className="h-12 w-12 opacity-80" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions rapides */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate(ROUTES.STORE.ORDERS)}
            className="btn btn-primary text-left flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Commandes</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.STORE.PREPARATION)}
            className="btn btn-primary text-left flex items-center space-x-2"
          >
            <Package className="h-4 w-4" />
            <span>Préparation</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.STORE.DELIVERIES)}
            className="btn btn-primary text-left flex items-center space-x-2"
          >
            <Truck className="h-4 w-4" />
            <span>Livraisons</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.STORE.PRODUCTS)}
            className="btn btn-primary text-left flex items-center space-x-2"
          >
            <Package className="h-4 w-4" />
            <span>Produits</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoreDashboard
