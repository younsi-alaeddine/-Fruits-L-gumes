import React, { useState, useEffect } from 'react'
import { ShoppingCart, Search, Filter, Calendar, Package, Eye, DollarSign, CheckCircle, XCircle, Clock, Truck, User, Store, ChevronRight, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getOrders } from '../../api/orders'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import { canAdminSeeOrder } from '../../utils/orderTimeValidation'

function AdminOrders() {
  const navigate = useNavigate()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [stats, setStats] = useState({ new: 0, aggregated: 0, supplierOrdered: 0, preparing: 0, shipping: 0, delivered: 0, totalCommission: 0 })

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const res = await getOrders({ limit: 2000 })
      const visibleOrders = (res?.orders || []).filter(o => canAdminSeeOrder(o.createdAt))
      setOrders(visibleOrders)
      
      // ✅ Nouveaux statuts (intermédiaire)
      const newOrders = visibleOrders.filter(o => o.status === 'NEW').length
      const aggregated = visibleOrders.filter(o => o.status === 'AGGREGATED').length
      const supplierOrdered = visibleOrders.filter(o => o.status === 'SUPPLIER_ORDERED').length
      const preparing = visibleOrders.filter(o => o.status === 'PREPARATION').length
      const shipping = visibleOrders.filter(o => o.status === 'LIVRAISON').length
      const delivered = visibleOrders.filter(o => o.status === 'LIVREE').length
      const totalCommission = visibleOrders.filter(o => o.status === 'LIVREE').reduce((sum, o) => sum + (o.totalMargin ?? 0), 0)
      
      setStats({ new: newOrders, aggregated, supplierOrdered, preparing, shipping, delivered, totalCommission })
    } catch (error) {
      showError('Erreur chargement commandes')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (order) => {
    setSelectedOrder(order)
    setShowDetailModal(true)
  }

  const getStatusColor = (status) => {
    const colors = {
      'NEW': 'bg-blue-100 text-blue-700',
      'AGGREGATED': 'bg-purple-100 text-purple-700',
      'SUPPLIER_ORDERED': 'bg-indigo-100 text-indigo-700',
      'PREPARATION': 'bg-yellow-100 text-yellow-700',
      'LIVRAISON': 'bg-orange-100 text-orange-700',
      'LIVREE': 'bg-green-100 text-green-700',
      'ANNULEE': 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status) => {
    const labels = {
      'NEW': 'Nouvelle',
      'AGGREGATED': 'Agrégée',
      'SUPPLIER_ORDERED': 'Commande fournisseur',
      'PREPARATION': 'En préparation',
      'LIVRAISON': 'En livraison',
      'LIVREE': 'Livrée',
      'ANNULEE': 'Annulée',
    }
    return labels[status] || status
  }

  const getWorkflowSteps = (currentStatus) => {
    const steps = [
      { key: 'NEW', label: 'Nouvelle', icon: ShoppingCart },
      { key: 'AGGREGATED', label: 'Agrégée', icon: Package },
      { key: 'SUPPLIER_ORDERED', label: 'Commande fournisseur', icon: CheckCircle },
      { key: 'PREPARATION', label: 'Préparation', icon: Package },
      { key: 'LIVRAISON', label: 'Livraison', icon: Truck },
      { key: 'LIVREE', label: 'Livrée', icon: CheckCircle },
    ]
    
    const currentIndex = steps.findIndex(s => s.key === currentStatus)
    return steps.map((step, index) => ({
      ...step,
      completed: index < currentIndex,
      current: index === currentIndex,
      pending: index > currentIndex,
    }))
  }

  const filteredOrders = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    const matchSearch = !searchTerm || 
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.storeName?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchStatus && matchSearch
  })

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div></div>

  return (
    <div className="space-y-6">
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          Gestion Commandes
        </h1>
        <p className="text-gray-600">Toutes les commandes reçues (J-1)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <p className="text-xs text-gray-600 font-medium">Nouvelles</p>
          <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <p className="text-xs text-gray-600 font-medium">Agrégées</p>
          <p className="text-2xl font-bold text-purple-600">{stats.aggregated}</p>
        </div>
        <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200">
          <p className="text-xs text-gray-600 font-medium">Commande fournisseur</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.supplierOrdered}</p>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200">
          <p className="text-xs text-gray-600 font-medium">Préparation</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.preparing}</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
          <p className="text-xs text-gray-600 font-medium">Livraison</p>
          <p className="text-2xl font-bold text-orange-600">{stats.shipping}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <p className="text-xs text-gray-600 font-medium">Livrées</p>
          <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
          <p className="text-xs text-gray-600 font-medium">Commission</p>
          <p className="text-xl font-bold text-orange-600">{stats.totalCommission.toFixed(2)} €</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full">
            <option value="all">Tous les statuts</option>
            <option value="NEW">Nouvelles</option>
            <option value="AGGREGATED">Agrégées</option>
            <option value="SUPPLIER_ORDERED">Commande fournisseur</option>
            <option value="PREPARATION">En préparation</option>
            <option value="LIVRAISON">En livraison</option>
            <option value="LIVREE">Livrées</option>
          </select>
          <button className="btn-primary flex items-center justify-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Liste commandes */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">N° Commande</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Magasin</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Produits</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Montant HT</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Commission</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Statut</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber || `CMD-${order.id}`}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{order.storeName || 'Magasin'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{order.items?.length || 0} produit(s)</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{order.totalHT?.toFixed(2) || '0.00'} €</td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    {(order.commission || 0).toFixed(2)} €
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleViewDetails(order)}
                    className="p-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune commande trouvée</p>
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
                  <h2 className="text-2xl font-bold text-gray-900">Commande {selectedOrder.orderNumber || `#${selectedOrder.id}`}</h2>
                  <p className="text-sm text-gray-500">Date: {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Workflow */}
              <div>
                <h3 className="font-bold text-lg mb-4">Statut de la commande</h3>
                <div className="flex items-center justify-between">
                  {getWorkflowSteps(selectedOrder.status).map((step, index) => {
                    const Icon = step.icon
                    return (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            step.completed ? 'bg-green-500 text-white' :
                            step.current ? 'bg-primary-500 text-white animate-pulse' :
                            'bg-gray-200 text-gray-400'
                          }`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <p className={`text-xs mt-2 font-medium ${
                            step.current ? 'text-primary-600' : 'text-gray-600'
                          }`}>{step.label}</p>
                        </div>
                        {index < getWorkflowSteps(selectedOrder.status).length - 1 && (
                          <div className={`flex-1 h-1 mx-2 ${
                            step.completed ? 'bg-green-500' : 'bg-gray-200'
                          }`}></div>
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>

              {/* Infos magasin */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card bg-gray-50">
                  <p className="text-sm text-gray-600 mb-1">Magasin</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.storeName || 'N/A'}</p>
                </div>
                <div className="card bg-gray-50">
                  <p className="text-sm text-gray-600 mb-1">Commission</p>
                  <p className="font-semibold text-green-600">{(selectedOrder.commission || 0).toFixed(2)} €</p>
                </div>
              </div>

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
                          <td className="px-4 py-2 text-sm font-medium">{item.product?.name || 'Produit'}</td>
                          <td className="px-4 py-2 text-sm text-right">{item.quantity} {item.unit || 'kg'}</td>
                          <td className="px-4 py-2 text-sm text-right">{item.unitPrice?.toFixed(2) || '0.00'} €</td>
                          <td className="px-4 py-2 text-sm text-right font-semibold">{item.totalPrice?.toFixed(2) || '0.00'} €</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right">Total HT :</td>
                        <td className="px-4 py-3 text-right">{selectedOrder.totalHT?.toFixed(2) || '0.00'} €</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right">TVA (20%) :</td>
                        <td className="px-4 py-3 text-right">{(selectedOrder.totalTVA ?? (selectedOrder.totalHT || 0) * 0.2).toFixed(2)} €</td>
                      </tr>
                      <tr className="text-lg">
                        <td colSpan="3" className="px-4 py-3 text-right">Total TTC :</td>
                        <td className="px-4 py-3 text-right text-primary-600">{(selectedOrder.totalTTC ?? (selectedOrder.totalHT || 0) * 1.2).toFixed(2)} €</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4 border-t">
                {selectedOrder.status === 'NEW' && (
                  <button className="btn-primary flex-1 py-3">Agréger</button>
                )}
                {selectedOrder.status === 'AGGREGATED' && (
                  <button className="btn-primary flex-1 py-3">Créer commande fournisseur</button>
                )}
                {selectedOrder.status === 'SUPPLIER_ORDERED' && (
                  <button className="btn-primary flex-1 py-3">Marquer "En préparation"</button>
                )}
                {selectedOrder.status === 'PREPARATION' && (
                  <button className="btn-primary flex-1 py-3">Marquer "En livraison"</button>
                )}
                {selectedOrder.status === 'LIVRAISON' && (
                  <button className="btn-primary flex-1 py-3">Marquer "Livrée"</button>
                )}
                <button onClick={() => setShowDetailModal(false)} className="btn-secondary py-3 px-6">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
