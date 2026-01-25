import React, { useState, useEffect } from 'react'
import { 
  DollarSign, Edit2, History, TrendingUp, Search, Upload, Download,
  Plus, X, Save, Clock, Users, Package
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import Modal from '../../components/common/Modal'
import {
  getPrices,
  updatePrice,
  bulkUpdatePrices,
  getPriceHistory,
  getVolumePricing,
  createVolumePricing,
  getClientPricing,
  createClientPricing,
  getPriceStats,
  importPricesCSV,
  exportPricesCSV
} from '../../api/pricing'

function Pricing() {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast()
  
  const [prices, setPrices] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modals
  const [editModal, setEditModal] = useState(false)
  const [volumeModal, setVolumeModal] = useState(false)
  const [clientModal, setClientModal] = useState(false)
  const [historyModal, setHistoryModal] = useState(false)
  
  // Données sélectionnées
  const [selectedPrice, setSelectedPrice] = useState(null)
  const [priceHistory, setPriceHistory] = useState([])
  const [volumePricing, setVolumePricing] = useState([])
  const [clientPricing, setClientPricing] = useState([])
  
  // Formulaires
  const [editForm, setEditForm] = useState({ basePrice: '' })
  const [volumeForm, setVolumeForm] = useState({ minQty: '', price: '' })
  const [clientForm, setClientForm] = useState({ clientId: '', price: '' })

  useEffect(() => {
    loadPrices()
    loadStats()
  }, [])

  const loadPrices = async () => {
    try {
      setLoading(true)
      const data = await getPrices()
      setPrices(data.prices || [])
    } catch (error) {
      showError('Erreur lors du chargement des prix')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await getPriceStats()
      setStats(data.stats || {})
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  const handleEditPrice = async (e) => {
    e.preventDefault()
    try {
      await updatePrice(selectedPrice.id, {
        basePrice: parseFloat(editForm.basePrice)
      })
      
      showSuccess('Prix mis à jour avec succès')
      setEditModal(false)
      loadPrices()
      loadStats()
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleAddVolumePricing = async (e) => {
    e.preventDefault()
    try {
      await createVolumePricing({
        productId: selectedPrice.productId,
        minQty: parseInt(volumeForm.minQty),
        price: parseFloat(volumeForm.price)
      })
      
      showSuccess('Tarif volume ajouté')
      setVolumeForm({ minQty: '', price: '' })
      loadVolumePricing(selectedPrice.productId)
    } catch (error) {
      showError('Erreur lors de l\'ajout du tarif volume')
    }
  }

  const handleAddClientPricing = async (e) => {
    e.preventDefault()
    try {
      await createClientPricing({
        productId: selectedPrice.productId,
        clientId: clientForm.clientId,
        price: parseFloat(clientForm.price)
      })
      
      showSuccess('Tarif client ajouté')
      setClientForm({ clientId: '', price: '' })
      loadClientPricing(selectedPrice.productId)
    } catch (error) {
      showError('Erreur lors de l\'ajout du tarif client')
    }
  }

  const loadPriceHistory = async (productId) => {
    try {
      const data = await getPriceHistory(productId)
      setPriceHistory(data.history || [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadVolumePricing = async (productId) => {
    try {
      const data = await getVolumePricing(productId)
      setVolumePricing(data.volumePricing || [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadClientPricing = async (productId) => {
    try {
      const data = await getClientPricing({ productId })
      setClientPricing(data.clientPricing || [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleImportCSV = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      await importPricesCSV(file)
      showSuccess('Import réussi')
      loadPrices()
    } catch (error) {
      showError('Erreur lors de l\'import')
    }
  }

  const handleExportCSV = async () => {
    try {
      await exportPricesCSV()
      showSuccess('Export téléchargé')
    } catch (error) {
      showError('Erreur lors de l\'export')
    }
  }

  const filteredPrices = (prices || []).filter(p =>
    p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && prices.length === 0) {
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-900 to-green-600 bg-clip-text text-transparent">
          Gestion des Prix
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
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
          <Package className="h-10 w-10 text-blue-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Produits tarifés</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalProducts || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
          <DollarSign className="h-10 w-10 text-green-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Prix moyen</p>
          <p className="text-3xl font-bold text-gray-900">{(stats.avgPrice || 0).toFixed(2)} €</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
          <TrendingUp className="h-10 w-10 text-purple-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Tarifs volume</p>
          <p className="text-3xl font-bold text-gray-900">{stats.volumePricingCount || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
          <Users className="h-10 w-10 text-orange-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Tarifs clients</p>
          <p className="text-3xl font-bold text-gray-900">{stats.clientPricingCount || 0}</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher un produit ou catégorie..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix de base</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière MAJ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPrices.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{price.productName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{price.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-2xl font-bold text-green-600">{(price.basePrice || 0).toFixed(2)} €</span>
                    <span className="text-xs text-gray-500 ml-2">/kg</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {price.updatedAt ? new Date(price.updatedAt).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPrice(price)
                          setEditForm({ basePrice: price.basePrice })
                          setEditModal(true)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier prix"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPrice(price)
                          loadVolumePricing(price.productId)
                          setVolumeModal(true)
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Tarifs volume"
                      >
                        <TrendingUp className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPrice(price)
                          loadClientPricing(price.productId)
                          setClientModal(true)
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Tarifs clients"
                      >
                        <Users className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPrice(price)
                          loadPriceHistory(price.productId)
                          setHistoryModal(true)
                        }}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Historique"
                      >
                        <History className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPrices.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun prix trouvé</p>
          </div>
        )}
      </div>

      {/* Modal Edit */}
      {editModal && selectedPrice && (
        <Modal isOpen={editModal} onClose={() => setEditModal(false)} title={`Modifier le prix - ${selectedPrice.productName}`}>
          <form onSubmit={handleEditPrice} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prix de base (€/kg)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.basePrice}
                onChange={(e) => setEditForm({ ...editForm, basePrice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setEditModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Save className="h-5 w-5 inline mr-2" />
                Enregistrer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Volume */}
      {volumeModal && selectedPrice && (
        <Modal isOpen={volumeModal} onClose={() => setVolumeModal(false)} title={`Tarifs volume - ${selectedPrice.productName}`}>
          <div className="space-y-4">
            {/* Liste existante */}
            <div className="space-y-2">
              {volumePricing.map((vp) => (
                <div key={vp.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-semibold">≥ {vp.minQty} kg</span>
                    <span className="mx-2">→</span>
                    <span className="text-green-600 font-bold">{vp.price.toFixed(2)} €/kg</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulaire ajout */}
            <form onSubmit={handleAddVolumePricing} className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">Ajouter un tarif volume</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité min (kg)</label>
                  <input
                    type="number"
                    value={volumeForm.minQty}
                    onChange={(e) => setVolumeForm({ ...volumeForm, minQty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={volumeForm.price}
                    onChange={(e) => setVolumeForm({ ...volumeForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Plus className="h-5 w-5 inline mr-2" />
                Ajouter
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* Modal Client Pricing */}
      {clientModal && selectedPrice && (
        <Modal isOpen={clientModal} onClose={() => setClientModal(false)} title={`Tarifs clients - ${selectedPrice.productName}`}>
          <div className="space-y-4">
            {/* Liste existante */}
            <div className="space-y-2">
              {clientPricing.map((cp) => (
                <div key={cp.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{cp.clientName}</span>
                  <span className="text-green-600 font-bold">{cp.price.toFixed(2)} €/kg</span>
                </div>
              ))}
            </div>

            {/* Formulaire ajout */}
            <form onSubmit={handleAddClientPricing} className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">Ajouter un tarif client</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <input
                  type="text"
                  placeholder="ID client"
                  value={clientForm.clientId}
                  onChange={(e) => setClientForm({ ...clientForm, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€/kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={clientForm.price}
                  onChange={(e) => setClientForm({ ...clientForm, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <button type="submit" className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Plus className="h-5 w-5 inline mr-2" />
                Ajouter
              </button>
            </form>
          </div>
        </Modal>
      )}

      {/* Modal History */}
      {historyModal && selectedPrice && (
        <Modal isOpen={historyModal} onClose={() => setHistoryModal(false)} title={`Historique des prix - ${selectedPrice.productName}`}>
          <div className="space-y-3">
            {priceHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun historique disponible</p>
            ) : (
              priceHistory.map((history) => (
                <div key={history.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold">{history.price.toFixed(2)} €/kg</p>
                      <p className="text-xs text-gray-500">
                        {new Date(history.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {history.changedBy && (
                    <span className="text-xs text-gray-500">Par: {history.changedBy}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Pricing
