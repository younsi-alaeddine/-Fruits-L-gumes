import React, { useState, useEffect } from 'react'
import { Store, MapPin, Phone, Mail, Users, Package, TrendingUp, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/common/DataTable'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getClientShops } from '../../api/stores'
import { getOrders } from '../../api/orders'
import { format } from 'date-fns'

/**
 * Page de gestion des magasins - CLIENT
 * Affiche tous les magasins du client avec leurs statistiques
 */
function ClientStores() {
  const navigate = useNavigate()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [stores, setStores] = useState([])
  const [storesStats, setStoresStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await loadStores()
      await loadStoresStats()
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStores = async () => {
    try {
      const res = await getClientShops({ page: 1, limit: 200 })
      setStores(res?.shops ?? [])
    } catch (error) {
      showError('Erreur lors du chargement des magasins')
      console.error(error)
    }
  }

  const loadStoresStats = async () => {
    try {
      const res = await getOrders({ scope: 'org', limit: 500 })
      const allOrders = res?.orders ?? []
      const pending = ['NEW', 'AGGREGATED', 'SUPPLIER_ORDERED', 'PREPARATION', 'LIVRAISON']
      const ready = ['PREPARATION']
      const now = new Date()
      const stats = {}
      for (const store of stores) {
        if (!store?.id) continue
        const orders = allOrders.filter((o) => o.shopId === store.id)
        stats[store.id] = {
          totalOrders: orders.length,
          ordersThisMonth: orders.filter((o) => {
            const d = new Date(o.createdAt)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          }).length,
          totalAmount: orders.reduce((sum, o) => sum + (o.totalTTC || o.total || 0), 0),
          pendingOrders: orders.filter((o) => pending.includes(o.status)).length,
          readyOrders: orders.filter((o) => ready.includes(o.status)).length,
        }
      }
      setStoresStats(stats)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (stores.length > 0) {
      loadStoresStats()
    }
  }, [stores])

  const handleViewStore = (store) => {
    navigate(`/client/stores/${store.id}`)
  }

  const handleSelectStore = (storeId) => {
    navigate(`/client/orders?store=${storeId}`)
  }

  const columns = [
    {
      key: 'name',
      label: 'Magasin',
      render: (value) => (
        <div>
          <p className="font-semibold text-gray-900">{value}</p>
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Adresse',
      render: (value, store) => (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span>
            {[value, store?.postalCode, store?.city].filter(Boolean).join(', ') || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (value, store) => (
        <div className="text-sm text-gray-600">
          {(value || store?.contactPhone) && (
            <div className="flex items-center space-x-1">
              <Phone className="h-3 w-3" />
              <span>{value || store?.contactPhone}</span>
            </div>
          )}
          {(store?.contactEmail || store?.contactPerson) && (
            <div className="flex items-center space-x-1 mt-1">
              <Mail className="h-3 w-3" />
              <span>{store.contactEmail || store.contactPerson}</span>
            </div>
          )}
          {!value && !store?.contactPhone && !store?.contactEmail && !store?.contactPerson && '—'}
        </div>
      ),
    },
    {
      key: 'stats',
      label: 'Statistiques',
      render: (_, store) => {
        const stats = storesStats[store.id] || {}
        return (
          <div className="text-sm">
            <div className="flex items-center space-x-1 text-gray-600">
              <Package className="h-3 w-3" />
              <span>{stats.totalOrders || 0} commandes</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalAmount?.toFixed(2) || '0.00'} € total
            </div>
          </div>
        )
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, store) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleSelectStore(store.id)}
            className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg hover:bg-primary-200 transition-colors"
            title="Voir les commandes"
          >
            Commandes
          </button>
          <button
            onClick={() => handleViewStore(store)}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Magasins</h1>
          <p className="text-gray-600">Gestion et suivi de tous vos magasins</p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total magasins</p>
              <p className="text-2xl font-bold text-gray-900">{stores.length}</p>
            </div>
            <Store className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total commandes</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(storesStats).reduce((sum, stats) => sum + (stats.totalOrders || 0), 0)}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Commandes en attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(storesStats).reduce((sum, stats) => sum + (stats.pendingOrders || 0), 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(storesStats).reduce((sum, stats) => sum + (stats.totalAmount || 0), 0).toFixed(2)} €
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Liste des magasins avec détails */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => {
          const stats = storesStats[store.id] || {}
          return (
            <div
              key={store.id}
              className="card bg-gradient-to-r from-white to-gray-50 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleViewStore(store)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Store className="h-5 w-5 text-primary-600" />
                  <h3 className="font-bold text-gray-900 text-lg">{store.name}</h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewStore(store)
                  }}
                  className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {store.address && (
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{store.address.street}</p>
                      {store.address.city && (
                        <p>{store.address.zipCode} {store.address.city}</p>
                      )}
                    </div>
                  </div>
                )}

                {store.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{store.phone}</span>
                  </div>
                )}

                {store.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{store.email}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Commandes</p>
                    <p className="text-lg font-bold text-gray-900">{stats.totalOrders || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">En attente</p>
                    <p className="text-lg font-bold text-orange-600">{stats.pendingOrders || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Prêtes</p>
                    <p className="text-lg font-bold text-green-600">{stats.readyOrders || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">CA Total</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(stats.totalAmount || 0).toFixed(2)} €
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectStore(store.id)
                  }}
                  className="w-full btn btn-primary text-sm"
                >
                  Voir les commandes
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tableau des magasins (vue alternative) */}
      {stores.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Vue tableau</h3>
          <DataTable
            data={stores}
            columns={columns}
            currentPage={1}
            totalPages={1}
            total={stores.length}
            onPageChange={() => {}}
            loading={loading}
            emptyMessage="Aucun magasin trouvé"
          />
        </div>
      )}

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  )
}

export default ClientStores
