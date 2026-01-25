import React, { useState, useEffect } from 'react'
import { Users, Store, ShoppingCart, Package, TrendingUp, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROUTES } from '../../constants/routes'
import { getClients } from '../../api/clients'
import { getStores } from '../../api/stores'
import { getUsers } from '../../api/users'
import { getOrders } from '../../api/orders'
import { getProducts } from '../../api/products'

/**
 * Dashboard ADMIN - Vue globale du système
 */
function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({
    clients: 0,
    stores: 0,
    users: 0,
    orders: 0,
    products: 0,
    revenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [clientsRes, storesRes, usersRes, ordersRes, productsRes] = await Promise.all([
        getClients(),
        getStores(),
        getUsers(),
        getOrders(),
        getProducts(),
      ])

      const orders = ordersRes.data || []
      const revenue = orders
        .filter((o) => o.status === 'livrée')
        .reduce((sum, o) => sum + (o.totalTTC || o.total || 0), 0)

      setStats({
        clients: clientsRes.data?.length || 0,
        stores: storesRes.data?.length || 0,
        users: usersRes.data?.length || 0,
        orders: orders.length,
        products: productsRes.data?.length || 0,
        revenue,
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
      title: 'Chiffre d\'affaires',
      value: `${stats.revenue.toFixed(2)} €`,
      icon: DollarSign,
      color: 'green',
      route: ROUTES.ADMIN.ORDERS,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord ADMIN</h1>
        <p className="text-gray-600">Vue globale du système</p>
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
            onClick={() => navigate(ROUTES.ADMIN.CLIENTS)}
            className="btn btn-primary text-left flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Nouveau client</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.ADMIN.STORES)}
            className="btn btn-primary text-left flex items-center space-x-2"
          >
            <Store className="h-4 w-4" />
            <span>Nouveau magasin</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.ADMIN.USERS)}
            className="btn btn-primary text-left flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Nouvel utilisateur</span>
          </button>
          <button
            onClick={() => navigate(ROUTES.ADMIN.PRODUCTS)}
            className="btn btn-primary text-left flex items-center space-x-2"
          >
            <Package className="h-4 w-4" />
            <span>Nouveau produit</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
