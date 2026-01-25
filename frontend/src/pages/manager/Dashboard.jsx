import React, { useState, useEffect } from 'react'
import { Store, ShoppingCart, Package, TrendingUp, DollarSign, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROUTES } from '../../constants/routes'
import { getManagerShops } from '../../api/stores'
import { getOrders } from '../../api/orders'

/**
 * Dashboard MANAGER - Vue multi-magasins
 * Le manager voit TOUS ses magasins en un coup d'œil
 */
function ManagerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [myStores, setMyStores] = useState([])
  const [stats, setStats] = useState({
    totalStores: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const storesRes = await getManagerShops({ page: 1, limit: 200 })
      const stores = storesRes?.shops ?? []
      setMyStores(stores)

      const storeIds = stores.map((s) => s.id)
      let allOrders = []
      for (const storeId of storeIds) {
        const ordersRes = await getOrders({ storeId, limit: 500 })
        allOrders = [...allOrders, ...(ordersRes?.orders ?? [])]
      }

      const revenue = allOrders
        .filter((o) => o.status === 'LIVREE')
        .reduce((sum, o) => sum + (o.totalTTC || o.total || 0), 0)

      setStats({
        totalStores: stores.length,
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter(o => ['NEW', 'AGGREGATED', 'SUPPLIER_ORDERED', 'PREPARATION', 'LIVRAISON'].includes(o.status)).length,
        totalRevenue: revenue,
      })
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center animate-bounce-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full bg-primary-100 blur-xl animate-pulse"></div>
          </div>
          <p className="text-gray-600 font-medium animate-pulse">Chargement des données...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Mes Magasins',
      value: stats.totalStores,
      icon: Store,
      color: 'primary',
      route: ROUTES.MANAGER.STORES,
    },
    {
      title: 'Commandes totales',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'blue',
      route: ROUTES.MANAGER.ORDERS,
    },
    {
      title: 'En attente',
      value: stats.pendingOrders,
      icon: Package,
      color: 'orange',
      route: ROUTES.MANAGER.ORDERS,
    },
    {
      title: 'Chiffre d\'affaires',
      value: `${stats.totalRevenue.toFixed(2)} €`,
      icon: DollarSign,
      color: 'green',
      route: ROUTES.MANAGER.REPORTS,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          Dashboard MANAGER
        </h1>
        <p className="text-gray-600 text-lg">Vue consolidée de vos {stats.totalStores} magasin(s)</p>
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
              className={`group relative overflow-hidden card bg-gradient-to-br ${colorClasses[card.color]} cursor-pointer card-hover shine animate-scale-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm text-gray-600 mb-1 font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 group-hover:scale-110 transition-transform">
                    {card.value}
                  </p>
                </div>
                <div className="relative">
                  <Icon className="h-12 w-12 opacity-60 group-hover:opacity-100 transition-all group-hover:rotate-12 group-hover:scale-125" />
                  <div className="absolute inset-0 bg-white/30 rounded-full blur-xl group-hover:bg-white/50 transition-all"></div>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          )
        })}
      </div>

      {/* Liste des magasins */}
      <div className="card animate-slide-up shadow-lg" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Store className="h-6 w-6 mr-2 text-primary-600" />
          Mes Magasins
        </h2>
        {myStores.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun magasin assigné</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myStores.map((store) => (
              <div
                key={store.id}
                onClick={() => navigate(ROUTES.MANAGER.STORES)}
                className="card bg-gradient-to-br from-white to-gray-50 cursor-pointer hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Store className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{store.name}</h3>
                    <p className="text-xs text-gray-500">{store.code}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{store.address?.street}</p>
                  <p>{store.address?.zipCode} {store.address?.city}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="card animate-slide-up shadow-lg" style={{ animationDelay: '0.6s' }}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="h-6 w-6 mr-2 text-primary-600" />
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate(ROUTES.MANAGER.STORES)}
            className="group btn-ripple relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
          >
            <Store className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">Gérer mes magasins</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.MANAGER.ORDERS)}
            className="group btn-ripple relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">Commandes</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.MANAGER.STOCKS)}
            className="group btn-ripple relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
          >
            <Package className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">Stocks</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.MANAGER.REPORTS)}
            className="group btn-ripple relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
          >
            <TrendingUp className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            <span className="font-semibold">Rapports</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ManagerDashboard
