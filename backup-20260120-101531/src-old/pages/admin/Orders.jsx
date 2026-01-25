import React, { useState, useEffect } from 'react'
import { ShoppingCart, Search, Filter, Calendar, Package, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePermission } from '../../hooks/usePermission'
import { RESOURCES, ACTIONS } from '../../constants/permissions'
import ProtectedRoute from '../../components/common/ProtectedRoute'
import DataTable from '../../components/common/DataTable'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getOrders } from '../../api/orders'
import { getClients } from '../../api/clients'
import { getStores } from '../../api/stores'
import { format } from 'date-fns'

/**
 * Page de gestion des commandes - ADMIN
 * Affiche toutes les commandes de tous les clients et magasins
 */
function AdminOrders() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { canRead } = usePermission(RESOURCES.ORDERS)
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [storeFilter, setStoreFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [currentPage])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadOrders(), loadClients(), loadStores()])
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 20,
        status: statusFilter || undefined,
        clientId: clientFilter || undefined,
        storeId: storeFilter || undefined,
      }

      const response = await getOrders(params)
      setOrders(response.data || [])
      setTotalPages(response.totalPages || 1)
      setTotal(response.total || 0)
    } catch (error) {
      showError('Erreur lors du chargement des commandes')
      console.error(error)
    }
  }

  const loadClients = async () => {
    try {
      const response = await getClients()
      setClients(response.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadStores = async () => {
    try {
      const response = await getStores()
      setStores(response.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (statusFilter !== undefined || clientFilter !== undefined || storeFilter !== undefined) {
      setCurrentPage(1)
      loadOrders()
    }
  }, [statusFilter, clientFilter, storeFilter])

  const handleViewOrder = (order) => {
    // Naviguer vers les détails de la commande
    navigate(`/admin/orders/${order.id}`)
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      order.orderNumber?.toLowerCase().includes(search) ||
      order.clientId?.toLowerCase().includes(search)
    )
  })

  // Statistiques
  const stats = {
    total: orders.length,
    byStatus: orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {}),
    totalAmount: orders.reduce((sum, order) => sum + (order.totalTTC || order.total || 0), 0),
  }

  const columns = [
    {
      key: 'orderNumber',
      label: 'N° Commande',
      render: (value, order) => (
        <div>
          <p className="font-semibold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">
            {format(new Date(order.createdAt), 'dd MMM yyyy HH:mm')}
          </p>
        </div>
      ),
    },
    {
      key: 'clientId',
      label: 'Client',
      render: (value) => {
        const client = clients.find((c) => c.id === value)
        return (
          <span className="text-sm text-gray-600">
            {client?.companyName || value || 'Non assigné'}
          </span>
        )
      },
    },
    {
      key: 'storeId',
      label: 'Magasin',
      render: (value) => {
        const store = stores.find((s) => s.id === value)
        return (
          <span className="text-sm text-gray-600">
            {store?.name || value || 'Non assigné'}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Statut',
      render: (value) => <OrderStatusBadge status={value} />,
    },
    {
      key: 'deliveryDate',
      label: 'Livraison',
      render: (value) => (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{value ? format(new Date(value), 'dd MMM yyyy') : 'Non définie'}</span>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Articles',
      render: (value) => (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Package className="h-4 w-4" />
          <span>{value?.length || 0} articles</span>
        </div>
      ),
    },
    {
      key: 'totalTTC',
      label: 'Montant',
      render: (value, order) => (
        <div>
          <p className="font-bold text-gray-900">
            {order.totalTTC?.toFixed(2) || order.total?.toFixed(2) || '0.00'} €
          </p>
          <p className="text-xs text-gray-500">TTC</p>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, order) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewOrder(order)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Voir les détails"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredRole="ADMIN" requiredResource={RESOURCES.ORDERS} requiredAction={ACTIONS.READ}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Commandes</h1>
            <p className="text-gray-600">Toutes les commandes de tous les clients et magasins</p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total commandes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En préparation</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.byStatus['en_préparation'] || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="card bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Prêtes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.byStatus['prête'] || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="card bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Montant total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalAmount.toFixed(2)} €
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une commande..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10"
              >
                <option value="">Tous les statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="envoyée">Envoyée</option>
                <option value="confirmée">Confirmée</option>
                <option value="en_préparation">En préparation</option>
                <option value="prête">Prête</option>
                <option value="livrée">Livrée</option>
                <option value="annulée">Annulée</option>
              </select>
            </div>
            <div>
              <select
                value={clientFilter}
                onChange={(e) => {
                  setClientFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="input"
              >
                <option value="">Tous les clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={storeFilter}
                onChange={(e) => {
                  setStoreFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="input"
              >
                <option value="">Tous les magasins</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tableau des commandes */}
        <DataTable
          data={filteredOrders}
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          loading={loading}
          emptyMessage="Aucune commande trouvée"
        />

        {/* Toast */}
        <Toast {...toast} onClose={hideToast} />
      </div>
    </ProtectedRoute>
  )
}

export default AdminOrders
