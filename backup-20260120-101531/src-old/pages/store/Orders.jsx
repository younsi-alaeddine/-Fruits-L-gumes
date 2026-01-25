import React, { useState, useEffect } from 'react'
import { ShoppingCart, Search, Filter, Calendar, Package, Eye, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import { usePermission } from '../../hooks/usePermission'
import { RESOURCES, ACTIONS } from '../../constants/permissions'
import ProtectedRoute from '../../components/common/ProtectedRoute'
import DataTable from '../../components/common/DataTable'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getOrders, confirmOrder, cancelOrder } from '../../api/orders'
import { format } from 'date-fns'

/**
 * Page de gestion des commandes - MAGASIN
 * Affiche toutes les commandes du magasin avec filtres et actions
 */
function StoreOrders() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { activeStore } = useStore()
  const { canConfirm, canCancel } = usePermission(RESOURCES.ORDERS)
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, orderId: null })
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, orderId: null })

  useEffect(() => {
    if (activeStore?.id) {
      loadOrders()
    }
  }, [activeStore, currentPage, statusFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params = {
        storeId: activeStore.id,
        page: currentPage,
        limit: 20,
        status: statusFilter || undefined,
      }

      const response = await getOrders(params)
      setOrders(response.data || [])
      setTotalPages(response.totalPages || 1)
      setTotal(response.total || 0)
    } catch (error) {
      showError('Erreur lors du chargement des commandes')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmOrder = async (orderId) => {
    try {
      await confirmOrder(orderId)
      showSuccess('Commande confirmée avec succès')
      loadOrders()
    } catch (error) {
      showError('Erreur lors de la confirmation de la commande')
      console.error(error)
    }
    setConfirmDialog({ isOpen: false, orderId: null })
  }

  const handleCancelOrder = async (orderId) => {
    try {
      await cancelOrder(orderId)
      showSuccess('Commande annulée avec succès')
      loadOrders()
    } catch (error) {
      showError('Erreur lors de l\'annulation de la commande')
      console.error(error)
    }
    setCancelDialog({ isOpen: false, orderId: null })
  }

  const handleViewOrder = (order) => {
    // Naviguer vers les détails de la commande
    navigate(`/store/orders/${order.id}`)
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      order.orderNumber?.toLowerCase().includes(search) ||
      order.clientId?.toLowerCase().includes(search)
    )
  })

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
          <span>{format(new Date(value), 'dd MMM yyyy')}</span>
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
            {order.totalTTC?.toFixed(2) || order.total?.toFixed(2)} €
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
          {order.status === 'envoyée' && canConfirm && (
            <button
              onClick={() => setConfirmDialog({ isOpen: true, orderId: order.id })}
              className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-200 transition-colors"
            >
              Confirmer
            </button>
          )}
          {(order.status === 'brouillon' || order.status === 'envoyée') && canCancel && (
            <button
              onClick={() => setCancelDialog({ isOpen: true, orderId: order.id })}
              className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors"
            >
              Annuler
            </button>
          )}
          {order.status === 'confirmée' && (
            <button
              onClick={() => navigate('/store/preparation')}
              className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg hover:bg-primary-200 transition-colors flex items-center space-x-1"
            >
              <Package className="h-3 w-3" />
              <span>Préparer</span>
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredResource={RESOURCES.ORDERS} requiredAction={ACTIONS.READ}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Commandes
            </h1>
            {activeStore && (
              <p className="text-gray-600">
                {activeStore.name} - Toutes les commandes du magasin
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/store/preparation')}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Package className="h-4 w-4" />
              <span>Préparation</span>
            </button>
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

        {/* Dialog de confirmation */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ isOpen: false, orderId: null })}
          onConfirm={() => handleConfirmOrder(confirmDialog.orderId)}
          title="Confirmer la commande"
          message="Êtes-vous sûr de vouloir confirmer cette commande ? Elle passera en état 'Confirmée' et sera disponible pour la préparation."
          confirmText="Confirmer"
          type="info"
        />

        {/* Dialog d'annulation */}
        <ConfirmDialog
          isOpen={cancelDialog.isOpen}
          onClose={() => setCancelDialog({ isOpen: false, orderId: null })}
          onConfirm={() => handleCancelOrder(cancelDialog.orderId)}
          title="Annuler la commande"
          message="Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible."
          confirmText="Annuler la commande"
          type="danger"
        />

        {/* Toast */}
        <Toast {...toast} onClose={hideToast} />
      </div>
    </ProtectedRoute>
  )
}

export default StoreOrders
