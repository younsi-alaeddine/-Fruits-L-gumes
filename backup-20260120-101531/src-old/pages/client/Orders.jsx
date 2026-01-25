import React, { useState, useEffect } from 'react'
import { ShoppingCart, Search, Filter, Calendar, Package, Eye, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/common/DataTable'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getOrders } from '../../api/orders'
import { getStores } from '../../api/stores'
import { format } from 'date-fns'

/**
 * Page de liste des commandes - CLIENT
 * Affiche toutes les commandes de tous les magasins du client
 * Permet de filtrer par magasin
 */
function ClientOrders() {
  const navigate = useNavigate()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [orders, setOrders] = useState([])
  const [stores, setStores] = useState([])
  const [selectedStoreId, setSelectedStoreId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [currentPage, selectedStoreId])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadOrders(), loadStores()])
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
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

  const loadOrders = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 20,
        status: statusFilter || undefined,
        storeId: selectedStoreId || undefined,
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

  useEffect(() => {
    if (statusFilter !== undefined) {
      setCurrentPage(1)
      loadOrders()
    }
  }, [statusFilter])

  const handleViewOrder = (order) => {
    navigate(`/client/orders/${order.id}`)
  }

  const handleCreateOrder = () => {
    navigate('/client/orders/create')
  }

  const handleSelectStore = (storeId) => {
    setSelectedStoreId(storeId)
    setCurrentPage(1)
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      order.orderNumber?.toLowerCase().includes(search) ||
      order.storeId?.toLowerCase().includes(search)
    )
  })

  // Statistiques consolidées
  const stats = {
    total: orders.length,
    byStatus: orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {}),
    totalAmount: orders.reduce((sum, order) => sum + (order.totalTTC || order.total || 0), 0),
    byStore: stores.reduce((acc, store) => {
      const storeOrders = orders.filter((o) => o.storeId === store.id)
      acc[store.id] = {
        count: storeOrders.length,
        amount: storeOrders.reduce((sum, o) => sum + (o.totalTTC || o.total || 0), 0),
      }
      return acc
    }, {}),
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
      key: 'storeId',
      label: 'Magasin',
      render: (value) => {
        const store = stores.find((s) => s.id === value)
        return (
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            {store && (
              <>
                <MapPin className="h-4 w-4" />
                <span>{store.name}</span>
              </>
            )}
            {!store && <span>{value || 'Non assigné'}</span>}
          </div>
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
    <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Commandes</h1>
            <p className="text-gray-600">Toutes vos commandes de tous vos magasins</p>
          </div>
          <button
            onClick={handleCreateOrder}
            className="btn btn-primary flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Nouvelle commande</span>
          </button>
        </div>

        {/* Sélecteur de magasin */}
        {stores.length > 1 && (
          <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Filtrer par magasin</p>
                <select
                  value={selectedStoreId || ''}
                  onChange={(e) => handleSelectStore(e.target.value || null)}
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
              {selectedStoreId && (
                <button
                  onClick={() => handleSelectStore(null)}
                  className="ml-4 text-sm text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Voir tous
                </button>
              )}
            </div>
          </div>
        )}

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

        {/* Performance par magasin */}
        {!selectedStoreId && stores.length > 1 && (
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Performance par magasin</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map((store) => {
                const storeStats = stats.byStore[store.id] || { count: 0, amount: 0 }
                return (
                  <div
                    key={store.id}
                    className="p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{store.name}</h4>
                      <button
                        onClick={() => handleSelectStore(store.id)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                      >
                        Filtrer
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Commandes</p>
                        <p className="text-xl font-bold text-gray-900">{storeStats.count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Montant</p>
                        <p className="text-xl font-bold text-gray-900">
                          {storeStats.amount.toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
  )
}

export default ClientOrders
