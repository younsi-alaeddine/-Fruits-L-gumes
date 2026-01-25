import React, { useState, useEffect } from 'react'
import {
  Truck, Calendar, MapPin, User, Package, Clock, CheckCircle,
  AlertCircle, Download, Search, Filter, Plus, Edit2, X
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import Modal from '../../components/common/Modal'
import {
  getDeliveries,
  getDeliveriesCalendar,
  createDelivery,
  updateDelivery,
  assignDriver,
  downloadDeliveryNote
} from '../../api/deliveries'
import { getOrders } from '../../api/orders'
import { getUsers } from '../../api/users'

function DeliveriesManagement() {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast()
  
  const [deliveries, setDeliveries] = useState([])
  const [orders, setOrders] = useState([])
  const [drivers, setDrivers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [viewMode, setViewMode] = useState('list') // 'list' ou 'calendar'
  
  // Modals
  const [createModal, setCreateModal] = useState(false)
  const [assignModal, setAssignModal] = useState(false)
  const [detailsModal, setDetailsModal] = useState(false)
  
  // Données sélectionnées
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  
  // Formulaires
  const [createForm, setCreateForm] = useState({
    orderId: '',
    deliveryDate: '',
    timeSlot: '09:00-12:00',
    notes: ''
  })
  
  const [assignForm, setAssignForm] = useState({
    driverId: '',
    vehicleInfo: ''
  })

  useEffect(() => {
    loadData()
  }, [statusFilter, dateFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (dateFilter) params.date = dateFilter
      
      const [deliveriesData, ordersData, usersData] = await Promise.all([
        getDeliveries(params),
        getOrders({ status: 'validée' }),
        getUsers()
      ])
      
      setDeliveries(deliveriesData.deliveries || [])
      setOrders(ordersData.orders || [])
      setDrivers((usersData.users || []).filter(u => u.role === 'DRIVER'))
      
      // Calcul stats
      const deliveriesList = deliveriesData.deliveries || []
      setStats({
        total: deliveriesList.length,
        pending: deliveriesList.filter(d => d.status === 'PENDING').length,
        inProgress: deliveriesList.filter(d => d.status === 'IN_PROGRESS').length,
        delivered: deliveriesList.filter(d => d.status === 'DELIVERED').length,
        failed: deliveriesList.filter(d => d.status === 'FAILED').length
      })
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDelivery = async (e) => {
    e.preventDefault()
    try {
      await createDelivery(createForm)
      showSuccess('Livraison créée avec succès')
      setCreateModal(false)
      setCreateForm({
        orderId: '',
        deliveryDate: '',
        timeSlot: '09:00-12:00',
        notes: ''
      })
      loadData()
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de la création')
    }
  }

  const handleAssignDriver = async (e) => {
    e.preventDefault()
    try {
      await assignDriver(
        selectedDelivery.id,
        assignForm.driverId,
        assignForm.vehicleInfo
      )
      
      showSuccess('Livreur assigné avec succès')
      setAssignModal(false)
      setAssignForm({ driverId: '', vehicleInfo: '' })
      setSelectedDelivery(null)
      loadData()
    } catch (error) {
      showError('Erreur lors de l\'assignation')
    }
  }

  const handleUpdateStatus = async (deliveryId, newStatus) => {
    try {
      await updateDelivery(deliveryId, { status: newStatus })
      showSuccess('Statut mis à jour')
      loadData()
    } catch (error) {
      showError('Erreur lors de la mise à jour')
    }
  }

  const handleDownloadNote = async (delivery) => {
    try {
      await downloadDeliveryNote(delivery.id)
      showSuccess('Téléchargement en cours...')
    } catch (error) {
      showError('Erreur lors du téléchargement')
    }
  }

  const getStatusBadge = (status) => {
    const configs = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' },
      IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En cours' },
      DELIVERED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Livrée' },
      FAILED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Échec' }
    }
    const config = configs[status] || configs.PENDING
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const filteredDeliveries = (deliveries || []).filter(d => {
    const order = d.order || {}
    const shop = order.shop || {}
    const searchMatch = 
      shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return searchMatch
  })

  // Orders sans livraison (pour le formulaire de création)
  const ordersWithoutDelivery = orders.filter(order => 
    !deliveries.some(d => d.orderId === order.id)
  )

  if (loading && deliveries.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} hideToast={hideToast} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
          Gestion des Livraisons
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className="btn-secondary"
          >
            {viewMode === 'list' ? <Calendar className="h-5 w-5 mr-2" /> : <Package className="h-5 w-5 mr-2" />}
            {viewMode === 'list' ? 'Vue calendrier' : 'Vue liste'}
          </button>
          <button onClick={() => setCreateModal(true)} className="btn-primary">
            <Plus className="h-5 w-5 mr-2" />
            Nouvelle livraison
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4">
          <Truck className="h-8 w-8 text-gray-500 mb-2" />
          <p className="text-sm text-gray-600 font-medium">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-4">
          <Clock className="h-8 w-8 text-yellow-500 mb-2" />
          <p className="text-sm text-gray-600 font-medium">En attente</p>
          <p className="text-2xl font-bold text-gray-900">{stats.pending || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
          <Truck className="h-8 w-8 text-blue-500 mb-2" />
          <p className="text-sm text-gray-600 font-medium">En cours</p>
          <p className="text-2xl font-bold text-gray-900">{stats.inProgress || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
          <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
          <p className="text-sm text-gray-600 font-medium">Livrées</p>
          <p className="text-2xl font-bold text-gray-900">{stats.delivered || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm text-gray-600 font-medium">Échecs</p>
          <p className="text-2xl font-bold text-gray-900">{stats.failed || 0}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="DELIVERED">Livrées</option>
            <option value="FAILED">Échecs</option>
          </select>
          
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Magasin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date livraison</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créneau</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Livreur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDeliveries.map((delivery) => {
                const order = delivery.order || {}
                const shop = order.shop || {}
                const driver = delivery.driver || {}
                
                return (
                  <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{shop.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(delivery.deliveryDate).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{delivery.timeSlot || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      {driver.name ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{driver.name}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedDelivery(delivery)
                            setAssignForm({ driverId: '', vehicleInfo: '' })
                            setAssignModal(true)
                          }}
                          className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                        >
                          Assigner
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(delivery.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownloadNote(delivery)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Télécharger bon"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        
                        {delivery.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateStatus(delivery.id, 'IN_PROGRESS')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Démarrer"
                          >
                            <Truck className="h-5 w-5" />
                          </button>
                        )}
                        
                        {delivery.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleUpdateStatus(delivery.id, 'DELIVERED')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Marquer livrée"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {filteredDeliveries.length === 0 && (
          <div className="text-center py-12">
            <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune livraison trouvée</p>
          </div>
        )}
      </div>

      {/* Modal Create */}
      {createModal && (
        <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Nouvelle livraison">
          <form onSubmit={handleCreateDelivery} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Commande *</label>
              <select
                value={createForm.orderId}
                onChange={(e) => setCreateForm({ ...createForm, orderId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner une commande</option>
                {ordersWithoutDelivery.map(order => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber} - {order.shop?.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date livraison *</label>
                <input
                  type="date"
                  value={createForm.deliveryDate}
                  onChange={(e) => setCreateForm({ ...createForm, deliveryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Créneau</label>
                <select
                  value={createForm.timeSlot}
                  onChange={(e) => setCreateForm({ ...createForm, timeSlot: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="09:00-12:00">09:00-12:00</option>
                  <option value="12:00-15:00">12:00-15:00</option>
                  <option value="15:00-18:00">15:00-18:00</option>
                  <option value="18:00-21:00">18:00-21:00</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setCreateModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Créer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Assign Driver */}
      {assignModal && selectedDelivery && (
        <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assigner un livreur">
          <form onSubmit={handleAssignDriver} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Livreur *</label>
              <select
                value={assignForm.driverId}
                onChange={(e) => setAssignForm({ ...assignForm, driverId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un livreur</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Véhicule</label>
              <input
                type="text"
                value={assignForm.vehicleInfo}
                onChange={(e) => setAssignForm({ ...assignForm, vehicleInfo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Camion 123ABC"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setAssignModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Assigner
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default DeliveriesManagement
