import React, { useState, useEffect } from 'react'
import {
  Factory, Plus, Search, Edit, Trash2, Phone, Mail, MapPin,
  Package, FileText, X, Save, Star, TrendingUp, Upload, Download
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import Modal from '../../components/common/Modal'
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierCatalog,
  getSupplierOrders,
  getSupplierEvaluations,
  getAllSuppliersStats,
  importSuppliersCSV,
  exportSuppliersCSV
} from '../../api/suppliers'

function Suppliers() {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast()
  
  const [suppliers, setSuppliers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modals
  const [addEditModal, setAddEditModal] = useState(false)
  const [detailsModal, setDetailsModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  
  // Données sélectionnées
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [supplierCatalog, setSupplierCatalog] = useState([])
  const [supplierOrders, setSupplierOrders] = useState([])
  const [supplierEvaluations, setSupplierEvaluations] = useState([])
  const [activeTab, setActiveTab] = useState('info')
  
  // Formulaire
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    siret: '',
    tva: '',
    paymentTerms: 'Net 30 jours',
    averageDeliveryDays: 2,
    notes: ''
  })

  useEffect(() => {
    loadSuppliers()
    loadStats()
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const data = await getSuppliers()
      setSuppliers(data.suppliers || [])
    } catch (error) {
      showError('Erreur lors du chargement des fournisseurs')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await getAllSuppliersStats()
      setStats(data.stats || {})
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  const handleViewDetails = async (supplier) => {
    try {
      const data = await getSupplier(supplier.id)
      setSelectedSupplier(data.supplier || supplier)
      
      const [catalogData, ordersData, evalData] = await Promise.all([
        getSupplierCatalog(supplier.id),
        getSupplierOrders({ supplierId: supplier.id }),
        getSupplierEvaluations(supplier.id)
      ])
      
      setSupplierCatalog(catalogData.catalog || [])
      setSupplierOrders(ordersData.orders || [])
      setSupplierEvaluations(evalData.evaluations || [])
      
      setDetailsModal(true)
      setActiveTab('info')
    } catch (error) {
      showError('Erreur lors du chargement des détails')
    }
  }

  const handleAddEdit = async (e) => {
    e.preventDefault()
    try {
      if (selectedSupplier) {
        await updateSupplier(selectedSupplier.id, formData)
        showSuccess('Fournisseur modifié avec succès')
      } else {
        await createSupplier(formData)
        showSuccess('Fournisseur créé avec succès')
      }
      
      setAddEditModal(false)
      setFormData({
        name: '',
        contact: '',
        email: '',
        phone: '',
        address: '',
        siret: '',
        tva: '',
        paymentTerms: 'Net 30 jours',
        averageDeliveryDays: 2,
        notes: ''
      })
      setSelectedSupplier(null)
      loadSuppliers()
      loadStats()
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de l\'enregistrement')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteSupplier(selectedSupplier.id)
      showSuccess('Fournisseur supprimé')
      setDeleteModal(false)
      setSelectedSupplier(null)
      loadSuppliers()
      loadStats()
    } catch (error) {
      showError('Erreur lors de la suppression')
    }
  }

  const handleImportCSV = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      await importSuppliersCSV(file)
      showSuccess('Import réussi')
      loadSuppliers()
    } catch (error) {
      showError('Erreur lors de l\'import')
    }
  }

  const handleExportCSV = async () => {
    try {
      await exportSuppliersCSV()
      showSuccess('Export téléchargé')
    } catch (error) {
      showError('Erreur lors de l\'export')
    }
  }

  const filteredSuppliers = (suppliers || []).filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status) => {
    const configs = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' },
      INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactif' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' }
    }
    const config = configs[status] || configs.ACTIVE
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>{config.label}</span>
  }

  if (loading && suppliers.length === 0) {
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-900 to-orange-600 bg-clip-text text-transparent">
          Gestion des Fournisseurs
        </h1>
        <div className="flex gap-2">
          <label className="btn-secondary cursor-pointer">
            <Upload className="h-5 w-5 mr-2" />
            Importer CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download className="h-5 w-5 mr-2" />
            Exporter CSV
          </button>
          <button
            onClick={() => {
              setSelectedSupplier(null)
              setFormData({
                name: '',
                contact: '',
                email: '',
                phone: '',
                address: '',
                siret: '',
                tva: '',
                paymentTerms: 'Net 30 jours',
                averageDeliveryDays: 2,
                notes: ''
              })
              setAddEditModal(true)
            }}
            className="btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nouveau Fournisseur
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
          <Factory className="h-10 w-10 text-orange-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Total Fournisseurs</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
          <Package className="h-10 w-10 text-green-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Produits catalogue</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCatalogProducts || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
          <FileText className="h-10 w-10 text-blue-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Commandes</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
          <Star className="h-10 w-10 text-purple-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Note moyenne</p>
          <p className="text-3xl font-bold text-gray-900">{(stats.avgRating || 0).toFixed(1)} / 5</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Délai moyen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Factory className="h-8 w-8 text-orange-500 mr-3" />
                      <span className="font-semibold text-gray-900">{supplier.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{supplier.contact || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{supplier.email || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{supplier.phone || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{supplier.averageDeliveryDays || 0} jours</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(supplier.status || 'ACTIVE')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(supplier)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <FileText className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSupplier(supplier)
                          setFormData(supplier)
                          setAddEditModal(true)
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSupplier(supplier)
                          setDeleteModal(true)
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <Factory className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun fournisseur trouvé</p>
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {addEditModal && (
        <Modal 
          isOpen={addEditModal} 
          onClose={() => {
            setAddEditModal(false)
            setSelectedSupplier(null)
          }} 
          title={selectedSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
        >
          <form onSubmit={handleAddEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SIRET</label>
                <input
                  type="text"
                  value={formData.siret}
                  onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">N° TVA</label>
                <input
                  type="text"
                  value={formData.tva}
                  onChange={(e) => setFormData({ ...formData, tva: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conditions paiement</label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Net 7 jours">Net 7 jours</option>
                  <option value="Net 15 jours">Net 15 jours</option>
                  <option value="Net 30 jours">Net 30 jours</option>
                  <option value="Net 45 jours">Net 45 jours</option>
                  <option value="Net 60 jours">Net 60 jours</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Délai livraison (jours)</label>
                <input
                  type="number"
                  value={formData.averageDeliveryDays}
                  onChange={(e) => setFormData({ ...formData, averageDeliveryDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setAddEditModal(false)
                  setSelectedSupplier(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="h-5 w-5 inline mr-2" />
                {selectedSupplier ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Détails */}
      {detailsModal && selectedSupplier && (
        <Modal 
          isOpen={detailsModal} 
          onClose={() => setDetailsModal(false)} 
          title={selectedSupplier.name}
        >
          <div className="space-y-6">
            {/* Onglets */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'info'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Informations
                </button>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'catalog'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Catalogue ({supplierCatalog.length})
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'orders'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Commandes ({supplierOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('evals')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'evals'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Évaluations ({supplierEvaluations.length})
                </button>
              </nav>
            </div>

            {/* Contenu onglets */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    <p className="font-semibold">{selectedSupplier.contact || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">{selectedSupplier.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-semibold">{selectedSupplier.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">SIRET</p>
                    <p className="font-semibold">{selectedSupplier.siret || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">N° TVA</p>
                    <p className="font-semibold">{selectedSupplier.tva || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Conditions paiement</p>
                    <p className="font-semibold">{selectedSupplier.paymentTerms || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Délai livraison</p>
                    <p className="font-semibold">{selectedSupplier.averageDeliveryDays || 0} jours</p>
                  </div>
                </div>
                {selectedSupplier.address && (
                  <div>
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="font-semibold">{selectedSupplier.address}</p>
                  </div>
                )}
                {selectedSupplier.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-gray-700">{selectedSupplier.notes}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'catalog' && (
              <div className="space-y-3">
                {supplierCatalog.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun produit au catalogue</p>
                ) : (
                  supplierCatalog.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{item.productName}</p>
                          <p className="text-sm text-gray-600">{item.supplierReference || '-'}</p>
                        </div>
                        <p className="font-bold text-green-600">{(item.price || 0).toFixed(2)} €</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-3">
                {supplierOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucune commande</p>
                ) : (
                  supplierOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">Commande #{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <p className="font-bold">{(order.totalAmount || 0).toFixed(2)} €</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'evals' && (
              <div className="space-y-3">
                {supplierEvaluations.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucune évaluation</p>
                ) : (
                  supplierEvaluations.map((evaluation) => (
                    <div key={evaluation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500 fill-current" />
                          <span className="font-semibold">{evaluation.rating} / 5</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(evaluation.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {evaluation.comment && (
                        <p className="text-sm text-gray-600">{evaluation.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Delete */}
      {deleteModal && selectedSupplier && (
        <Modal 
          isOpen={deleteModal} 
          onClose={() => {
            setDeleteModal(false)
            setSelectedSupplier(null)
          }} 
          title="Confirmer la suppression"
        >
          <div className="space-y-4">
            <p>Êtes-vous sûr de vouloir supprimer le fournisseur <strong>{selectedSupplier.name}</strong> ?</p>
            <p className="text-sm text-red-600">Cette action est irréversible.</p>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setDeleteModal(false)
                  setSelectedSupplier(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="h-5 w-5 inline mr-2" />
                Supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Suppliers
