import React, { useState, useEffect } from 'react'
import { Truck, Search, Filter, MapPin, Calendar, CheckCircle, XCircle, Package } from 'lucide-react'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { useStore } from '../../contexts/StoreContext'
import { getOrders } from '../../api/orders'
import { updateOrder } from '../../api/orders'
import { format } from 'date-fns'

/**
 * Page de livraisons - MAGASIN (LIVREUR)
 * Interface pour le livreur pour gérer les livraisons
 */
function StoreDeliveries() {
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  const { activeStore } = useStore()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('prête') // Prêtes à être livrées
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const activeStoreId = activeStore?.id

  useEffect(() => {
    if (activeStoreId) {
      loadOrders()
    }
  }, [statusFilter, activeStoreId])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params = {
        storeId: activeStoreId,
        status: statusFilter || undefined,
      }
      const response = await getOrders(params)
      
      // Filtrer les commandes prêtes à être livrées ou en cours de livraison
      const deliveryOrders = (response.data || []).filter(
        (order) => order.status === 'prête' || order.status === 'en_livraison'
      )
      
      setOrders(deliveryOrders)
    } catch (error) {
      showError('Erreur lors du chargement des commandes')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartDelivery = async (order) => {
    try {
      await updateOrder(order.id, { status: 'en_livraison' }, activeStoreId)
      showSuccess('Livraison démarrée')
      loadOrders()
    } catch (error) {
      showError('Erreur lors du démarrage de la livraison')
      console.error(error)
    }
  }

  const handleCompleteDelivery = async (order) => {
    setSelectedOrder(order)
    setModalOpen(true)
  }

  const handleConfirmDelivery = async (signature, notes) => {
    try {
      await updateOrder(selectedOrder.id, { 
        status: 'livrée',
        deliveredAt: new Date().toISOString(),
        deliveryNotes: notes,
        signature: signature,
      }, activeStoreId)
      showSuccess('Livraison confirmée')
      setModalOpen(false)
      setSelectedOrder(null)
      loadOrders()
    } catch (error) {
      showError('Erreur lors de la confirmation de livraison')
      console.error(error)
    }
  }

  const handleCancelDelivery = async (order) => {
    try {
      await updateOrder(order.id, { status: 'prête' }, activeStoreId)
      showSuccess('Livraison annulée')
      loadOrders()
    } catch (error) {
      showError('Erreur lors de l\'annulation de la livraison')
      console.error(error)
    }
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
    ready: orders.filter((o) => o.status === 'prête').length,
    inDelivery: orders.filter((o) => o.status === 'en_livraison').length,
    total: orders.length,
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
      key: 'deliveryDate',
      label: 'Date de livraison',
      render: (value) => (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{value ? format(new Date(value), 'dd MMM yyyy') : 'Non définie'}</span>
        </div>
      ),
    },
    {
      key: 'deliveryAddress',
      label: 'Adresse de livraison',
      render: (value, order) => (
        <div className="flex items-start space-x-1 text-sm text-gray-600">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            {value ? (
              <>
                <p>{value.street}</p>
                <p>{value.zipCode} {value.city}</p>
              </>
            ) : (
              <p>Adresse non disponible</p>
            )}
          </div>
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
        <p className="font-bold text-gray-900">
          {(order.totalTTC || order.total || 0).toFixed(2)} €
        </p>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            value === 'prête'
              ? 'bg-green-100 text-green-700'
              : value === 'en_livraison'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {value === 'prête' ? 'Prête' : value === 'en_livraison' ? 'En livraison' : value}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, order) => (
        <div className="flex items-center space-x-2">
          {order.status === 'prête' && (
            <button
              onClick={() => handleStartDelivery(order)}
              className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-200 transition-colors"
              title="Démarrer la livraison"
            >
              Démarrer
            </button>
          )}
          {order.status === 'en_livraison' && (
            <>
              <button
                onClick={() => handleCompleteDelivery(order)}
                className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-200 transition-colors"
                title="Confirmer la livraison"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleCancelDelivery(order)}
                className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors"
                title="Annuler la livraison"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Livraisons</h1>
          <p className="text-gray-600">Gestion des livraisons de commandes</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Prêtes à livrer</p>
              <p className="text-2xl font-bold text-gray-900">{stats.ready}</p>
            </div>
            <Package className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En cours</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inDelivery}</p>
            </div>
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Truck className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

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
              }}
              className="input pl-10"
            >
              <option value="">Tous les statuts</option>
              <option value="prête">Prêtes à livrer</option>
              <option value="en_livraison">En cours de livraison</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des livraisons */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        currentPage={1}
        totalPages={1}
        total={filteredOrders.length}
        onPageChange={() => {}}
        loading={loading}
        emptyMessage="Aucune livraison trouvée"
      />

      {/* Modal de confirmation de livraison */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedOrder(null)
        }}
        title="Confirmer la livraison"
        size="md"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Commande</p>
              <p className="font-semibold text-gray-900">{selectedOrder.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Adresse de livraison</p>
              {selectedOrder.deliveryAddress ? (
                <div>
                  <p className="text-gray-900">{selectedOrder.deliveryAddress.street}</p>
                  <p className="text-gray-900">
                    {selectedOrder.deliveryAddress.zipCode} {selectedOrder.deliveryAddress.city}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">Adresse non disponible</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes de livraison (optionnel)
              </label>
              <textarea
                placeholder="Notes sur la livraison..."
                className="input"
                rows="3"
                id="deliveryNotes"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Signature (optionnel)
              </label>
              <input
                type="text"
                placeholder="Nom du destinataire..."
                className="input"
                id="deliverySignature"
              />
            </div>
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false)
                  setSelectedOrder(null)
                }}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const notes = document.getElementById('deliveryNotes')?.value || ''
                  const signature = document.getElementById('deliverySignature')?.value || ''
                  handleConfirmDelivery(signature, notes)
                }}
                className="btn btn-primary"
              >
                Confirmer la livraison
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  )
}

export default StoreDeliveries
