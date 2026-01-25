import React, { useState, useEffect } from 'react'
import { ShoppingCart, Store, Package, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import { ROUTES } from '../../constants/routes'
import { getOrders } from '../../api/orders'
import { getStores } from '../../api/stores'
import StoreSelector from '../../components/stores/StoreSelector'

/**
 * Dashboard CLIENT - Vue consolidée de tous les magasins
 */
function ClientDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { stores, selectedStoreId } = useStore()
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    readyOrders: 0,
    totalRevenue: 0,
    storesCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [selectedStoreId])

  const loadStats = async () => {
    try {
      setLoading(true)
      const params = {
        clientId: user?.clientId,
        storeId: selectedStoreId || undefined,
      }
      const ordersRes = await getOrders(params)
      const storesRes = await getStores()

      const orders = ordersRes.data || []
      const allStores = storesRes.data || []
      const clientStores = allStores.filter((s) => s.clientId === user?.clientId)

      const totalRevenue = orders
        .filter((o) => o.status === 'livrée')
        .reduce((sum, o) => sum + (o.totalTTC || o.total || 0), 0)

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => ['envoyée', 'confirmée', 'en_préparation'].includes(o.status)).length,
        readyOrders: orders.filter((o) => o.status === 'prête').length,
        totalRevenue,
        storesCount: clientStores.length,
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

  const statCards = [
    {
      title: 'Total commandes',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'primary',
      route: ROUTES.CLIENT.ORDERS,
    },
    {
      title: 'Commandes en attente',
      value: stats.pendingOrders,
      icon: Calendar,
      color: 'orange',
      route: ROUTES.CLIENT.ORDERS,
    },
    {
      title: 'Commandes prêtes',
      value: stats.readyOrders,
      icon: Package,
      color: 'green',
      route: ROUTES.CLIENT.ORDERS,
    },
    {
      title: 'Chiffre d\'affaires',
      value: `${stats.totalRevenue.toFixed(2)} €`,
      icon: DollarSign,
      color: 'purple',
      route: ROUTES.CLIENT.FINANCES,
    },
    {
      title: 'Mes magasins',
      value: stats.storesCount,
      icon: Store,
      color: 'blue',
      route: ROUTES.CLIENT.STORES,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-600">Vue consolidée de tous vos magasins</p>
        </div>
        {stores.length > 1 && (
          <div className="flex items-center space-x-4">
            <StoreSelector />
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const colorClasses = {
            primary: 'from-primary-50 to-primary-100 border-primary-200 text-primary-600',
            blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600',
            green: 'from-green-50 to-green-100 border-green-200 text-green-600',
            purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600',
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
            onClick={() => navigate(ROUTES.CLIENT.ORDER_CREATE)}
            className="btn btn-primary text-left flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Nouvelle commande</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.CLIENT.ORDERS)}
            className="btn btn-primary text-left flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Mes commandes</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.CLIENT.STORES)}
            className="btn btn-primary text-left flex items-center space-x-2"
          >
            <Store className="h-4 w-4" />
            <span>Mes magasins</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.CLIENT.FINANCES)}
            className="btn btn-primary text-left flex items-center space-x-2"
          >
            <DollarSign className="h-4 w-4" />
            <span>Finances</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientDashboard
