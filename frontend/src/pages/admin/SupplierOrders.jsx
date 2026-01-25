import React, { useState, useEffect } from 'react'
import { Truck, Package, Calendar, CheckCircle, Clock, XCircle, Eye, Plus } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import { getSupplierOrders, getSupplierOrder } from '../../api/suppliers'
import { getOrders } from '../../api/orders'
import { createSupplierOrderFromAggregation } from '../../api/orders'
import { getSuppliers } from '../../api/suppliers'

/**
 * Page de gestion des commandes fournisseur - ADMIN
 * Affiche les commandes passées aux fournisseurs et permet d'en créer depuis les agrégations
 */
function SupplierOrders() {
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  const [supplierOrders, setSupplierOrders] = useState([])
  const [aggregatedOrders, setAggregatedOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadSupplierOrders(),
        loadAggregatedOrders(),
        loadSuppliers()
      ])
    } catch (error) {
      showError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const loadSupplierOrders = async () => {
    try {
      const res = await getSupplierOrders()
      setSupplierOrders(res?.orders ?? [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadAggregatedOrders = async () => {
    try {
      const res = await getOrders({ status: 'AGGREGATED' })
      setAggregatedOrders(res?.orders ?? [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadSuppliers = async () => {
    try {
      const res = await getSuppliers()
      setSuppliers(res?.suppliers ?? [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleCreateSupplierOrder = async () => {
    if (!selectedSupplier || !deliveryDate) {
      showError('Veuillez sélectionner un fournisseur et une date de livraison')
      return
    }

    try {
      setCreating(true)
      const result = await createSupplierOrderFromAggregation(selectedSupplier, deliveryDate)
      showSuccess('Commande fournisseur créée avec succès')
      await loadData()
      setSelectedSupplier('')
      setDeliveryDate('')
    } catch (error) {
      showError('Erreur lors de la création de la commande fournisseur')
      console.error(error)
    } finally {
      setCreating(false)
    }
  }

  const handleViewDetails = async (orderId) => {
    try {
      const res = await getSupplierOrder(orderId)
      setSelectedOrder(res?.order ?? null)
      setShowDetailModal(true)
    } catch (error) {
      showError('Erreur lors du chargement des détails')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'DRAFT': 'bg-gray-100 text-gray-700',
      'SENT': 'bg-blue-100 text-blue-700',
      'CONFIRMED': 'bg-green-100 text-green-700',
      'DELIVERED': 'bg-green-100 text-green-700',
      'CANCELLED': 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'DRAFT': 'Brouillon',
      'SENT': 'Envoyée',
      'CONFIRMED': 'Confirmée',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée',
    }
    return labels[status] || status
  }

  // Grouper les commandes agrégées par date
  const aggregatedByDate = aggregatedOrders.reduce((acc, order) => {
    const date = order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : 'Sans date'
    if (!acc[date]) acc[date] = []
    acc[date].push(order)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateString = maxDate.toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          Commandes Fournisseurs
        </h1>
        <p className="text-gray-600">Gérez les commandes passées aux fournisseurs depuis les agrégations</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <p className="text-xs text-gray-600 font-medium">Total commandes</p>
          <p className="text-3xl font-bold text-blue-600">{supplierOrders.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <p className="text-xs text-gray-600 font-medium">Commandes agrégées</p>
          <p className="text-3xl font-bold text-purple-600">{aggregatedOrders.length}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <p className="text-xs text-gray-600 font-medium">Livrées</p>
          <p className="text-3xl font-bold text-green-600">
            {supplierOrders.filter(o => o.status === 'DELIVERED').length}
          </p>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
          <p className="text-xs text-gray-600 font-medium">En attente</p>
          <p className="text-3xl font-bold text-orange-600">
            {supplierOrders.filter(o => ['DRAFT', 'SENT', 'CONFIRMED'].includes(o.status)).length}
          </p>
        </div>
      </div>

      {/* Créer commande fournisseur depuis agrégation */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Plus className="h-5 w-5 text-primary-600" />
          <span>Créer une commande fournisseur</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fournisseur
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full"
            >
              <option value="">Sélectionner un fournisseur</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date de livraison
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={today}
              max={maxDateString}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCreateSupplierOrder}
              disabled={!selectedSupplier || !deliveryDate || creating}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span>Créer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Commandes agrégées disponibles */}
      {Object.keys(aggregatedByDate).length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Package className="h-5 w-5 text-primary-600" />
            <span>Commandes agrégées disponibles</span>
          </h2>
          <div className="space-y-3">
            {Object.entries(aggregatedByDate).map(([date, orders]) => (
              <div key={date} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {date === 'Sans date' ? 'Sans date' : new Date(date).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-gray-600">{orders.length} commande(s) agrégée(s)</p>
                  </div>
                  <button
                    onClick={() => {
                      setDeliveryDate(date === 'Sans date' ? '' : date)
                    }}
                    className="btn-secondary text-sm"
                  >
                    Utiliser cette date
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des commandes fournisseur */}
      <div className="card overflow-x-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Commandes fournisseurs</h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">N° Commande</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fournisseur</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total HT</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Statut</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {supplierOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{order.supplier?.name || 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                  {order.totalHT?.toFixed(2) || '0.00'} €
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleViewDetails(order.id)}
                    className="p-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {supplierOrders.length === 0 && (
          <div className="text-center py-12">
            <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune commande fournisseur trouvée</p>
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Commande {selectedOrder.orderNumber}</h2>
                  <p className="text-sm text-gray-500">Fournisseur: {selectedOrder.supplier?.name}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Produits */}
              <div>
                <h3 className="font-bold text-lg mb-4">Produits commandés</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Produit</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Quantité</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Prix unit.</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm font-medium">{item.productName}</td>
                          <td className="px-4 py-2 text-sm text-right">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-2 text-sm text-right">{item.unitPrice?.toFixed(2) || '0.00'} €</td>
                          <td className="px-4 py-2 text-sm text-right font-semibold">{item.totalHT?.toFixed(2) || '0.00'} €</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right">Total HT :</td>
                        <td className="px-4 py-3 text-right">{selectedOrder.totalHT?.toFixed(2) || '0.00'} €</td>
                      </tr>
                      <tr className="text-lg">
                        <td colSpan="3" className="px-4 py-3 text-right">Total TTC :</td>
                        <td className="px-4 py-3 text-right text-primary-600">{selectedOrder.totalTTC?.toFixed(2) || '0.00'} €</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupplierOrders
