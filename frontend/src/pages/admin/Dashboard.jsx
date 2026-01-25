import React, { useState, useEffect } from 'react'
import { Users, Store, ShoppingCart, Package, TrendingUp, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { getAdminDashboardCounts } from '../../api/analytics'
import OrderTimeAlert from '../../components/OrderTimeAlert'

/**
 * Dashboard ADMIN - Vue globale du système
 * Chiffres issus de GET /api/admin/stats/counts (totaux réels en base).
 */
function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    clients: 0,
    stores: 0,
    users: 0,
    orders: 0,
    products: 0,
    commission: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const res = await getAdminDashboardCounts()
      const c = res?.counts || {}
      setStats({
        clients: c.clients ?? 0,
        stores: c.stores ?? 0,
        users: c.users ?? 0,
        orders: c.orders ?? 0,
        products: c.products ?? 0,
        commission: c.commission ?? 0,
      })
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
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
      title: 'Clients',
      value: stats.clients,
      icon: Users,
      color: 'primary',
      route: ROUTES.ADMIN.CLIENTS,
    },
    {
      title: 'Magasins',
      value: stats.stores,
      icon: Store,
      color: 'blue',
      route: ROUTES.ADMIN.STORES,
    },
    {
      title: 'Utilisateurs',
      value: stats.users,
      icon: Users,
      color: 'green',
      route: ROUTES.ADMIN.USERS,
    },
    {
      title: 'Commandes',
      value: stats.orders,
      icon: ShoppingCart,
      color: 'purple',
      route: ROUTES.ADMIN.ORDERS,
    },
    {
      title: 'Produits',
      value: stats.products,
      icon: Package,
      color: 'orange',
      route: ROUTES.ADMIN.PRODUCTS,
    },
    {
      title: 'Commission totale',  // ✅ Commission Fattah (pas CA)
      value: `${(stats.commission || 0).toFixed(2)} €`,
      icon: DollarSign,
      color: 'green',
      route: ROUTES.ADMIN.ORDERS,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          Tableau de bord ADMIN
        </h1>
        <p className="text-gray-600 text-lg">Vue globale du système</p>
      </div>

      {/* ✅ ALERTE HORAIRES : Info réception commandes à 00h00 */}
      <OrderTimeAlert role="ADMIN" />

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
              {/* Effet de brillance au hover */}
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          )
        })}
      </div>

      {/* Actions rapides - Design amélioré avec glass effect */}
      <div className="relative overflow-hidden rounded-2xl animate-slide-up" style={{ animationDelay: '0.6s' }}>
        {/* Background gradient animé */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 opacity-60"></div>
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
        
        {/* Contenu */}
        <div className="relative z-10 p-8 border-2 border-white/50 rounded-2xl shadow-xl">
          {/* Titre avec icône */}
          <div className="flex items-center mb-8">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg mr-4 animate-pulse">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Actions rapides
              </h2>
              <p className="text-sm text-gray-500 mt-1">Créez rapidement de nouveaux éléments</p>
            </div>
          </div>

          {/* Grille de boutons améliorée */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Nouveau client */}
            <button
              onClick={() => navigate(ROUTES.ADMIN.CLIENTS)}
              className="group relative overflow-hidden bg-white hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 border-2 border-green-200 hover:border-green-400 rounded-xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <span className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                  Nouveau client
                </span>
              </div>
              {/* Effet brillant */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>

            {/* Nouveau magasin */}
            <button
              onClick={() => navigate(ROUTES.ADMIN.STORES)}
              className="group relative overflow-hidden bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <span className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                  Nouveau magasin
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>

            {/* Nouvel utilisateur */}
            <button
              onClick={() => navigate(ROUTES.ADMIN.USERS)}
              className="group relative overflow-hidden bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 border-2 border-purple-200 hover:border-purple-400 rounded-xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <span className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                  Nouvel utilisateur
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>

            {/* Nouveau produit */}
            <button
              onClick={() => navigate(ROUTES.ADMIN.PRODUCTS)}
              className="group relative overflow-hidden bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-orange-100 border-2 border-orange-200 hover:border-orange-400 rounded-xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <span className="font-bold text-gray-800 group-hover:text-orange-700 transition-colors">
                  Nouveau produit
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
