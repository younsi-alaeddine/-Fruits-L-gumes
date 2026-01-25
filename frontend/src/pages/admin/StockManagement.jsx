import React, { useState, useEffect } from 'react'
import {
  Package, AlertTriangle, TrendingUp, BarChart2, Search, Download,
  Plus, Edit2, History, FileText, RefreshCw
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import Modal from '../../components/common/Modal'
import {
  getStocks,
  getStockAlerts,
  getStockStats,
  getStockMovements,
  adjustStock,
  updateStock,
  createInventory
} from '../../api/stocks'

function StockManagement() {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast()
  
  const [stocks, setStocks] = useState([])
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLowStock, setFilterLowStock] = useState(false)
  
  // Modals
  const [adjustModal, setAdjustModal] = useState(false)
  const [movementsModal, setMovementsModal] = useState(false)
  const [inventoryModal, setInventoryModal] = useState(false)
  const [editAlertModal, setEditAlertModal] = useState(false)
  
  // Données sélectionnées
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [movements, setMovements] = useState([])
  
  // Formulaires
  const [adjustForm, setAdjustForm] = useState({ quantity: '', reason: '' })
  const [alertForm, setAlertForm] = useState({ stockAlert: '' })
  const [inventoryItems, setInventoryItems] = useState([])

  useEffect(() => {
    loadData()
  }, [filterLowStock])

  const loadData = async () => {
    try {
      setLoading(true)
      const [stocksData, alertsData, statsData] = await Promise.all([
        getStocks({ lowStock: filterLowStock }),
        getStockAlerts(),
        getStockStats()
      ])
      
      setStocks(stocksData.products || [])
      setAlerts(alertsData.products || [])
      setStats(statsData.stats || {})
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustStock = async (e) => {
    e.preventDefault()
    try {
      await adjustStock(
        selectedProduct.id,
        parseFloat(adjustForm.quantity),
        adjustForm.reason
      )
      
      showSuccess('Stock ajusté avec succès')
      setAdjustModal(false)
      setAdjustForm({ quantity: '', reason: '' })
      setSelectedProduct(null)
      loadData()
    } catch (error) {
      showError('Erreur lors de l\'ajustement du stock')
    }
  }

  const handleUpdateAlert = async (e) => {
    e.preventDefault()
    try {
      await updateStock(selectedProduct.id, {
        stockAlert: parseInt(alertForm.stockAlert)
      })
      
      showSuccess('Seuil d\'alerte mis à jour')
      setEditAlertModal(false)
      setAlertForm({ stockAlert: '' })
      setSelectedProduct(null)
      loadData()
    } catch (error) {
      showError('Erreur lors de la mise à jour')
    }
  }

  const handleViewMovements = async (product) => {
    try {
      setSelectedProduct(product)
      const data = await getStockMovements(product.id)
      setMovements(data.movements || [])
      setMovementsModal(true)
    } catch (error) {
      showError('Erreur lors du chargement de l\'historique')
    }
  }

  const handleInventorySubmit = async () => {
    try {
      const items = inventoryItems.map(item => ({
        productId: item.productId,
        physicalCount: item.physicalCount,
        notes: item.notes
      }))
      
      await createInventory({ items })
      showSuccess('Inventaire enregistré')
      setInventoryModal(false)
      setInventoryItems([])
      loadData()
    } catch (error) {
      showError('Erreur lors de l\'inventaire')
    }
  }

  const filteredStocks = (stocks || []).filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && stocks.length === 0) {
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-purple-600 bg-clip-text text-transparent">
          Gestion des Stocks
        </h1>
        <button
          onClick={() => setInventoryModal(true)}
          className="btn-primary"
        >
          <FileText className="h-5 w-5 mr-2" />
          Inventaire
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
          <Package className="h-10 w-10 text-blue-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Total produits</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalProducts || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
          <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Stock bas</p>
          <p className="text-3xl font-bold text-gray-900">{stats.lowStockCount || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
          <AlertTriangle className="h-10 w-10 text-orange-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Rupture</p>
          <p className="text-3xl font-bold text-gray-900">{stats.outOfStockCount || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
          <TrendingUp className="h-10 w-10 text-green-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Valeur totale</p>
          <p className="text-3xl font-bold text-gray-900">{(stats.totalStockValue || 0).toFixed(0)} kg</p>
        </div>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">
                {alerts.length} produit(s) en stock bas
              </h3>
              <div className="flex flex-wrap gap-2">
                {alerts.slice(0, 5).map(product => (
                  <span key={product.id} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                    {product.name}: {product.stock} {product.unit}
                  </span>
                ))}
                {alerts.length > 5 && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                    +{alerts.length - 5} autres
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Seulement stock bas</span>
          </label>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock actuel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seuil alerte</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStocks.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{product.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-2xl font-bold ${
                      product.stock === 0 ? 'text-red-600' :
                      product.stock <= product.stockAlert ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{product.stockAlert} {product.unit}</span>
                  </td>
                  <td className="px-6 py-4">
                    {product.stock === 0 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        Rupture
                      </span>
                    ) : product.stock <= product.stockAlert ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                        Stock bas
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(product)
                          setAdjustForm({ quantity: '', reason: '' })
                          setAdjustModal(true)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ajuster stock"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product)
                          setAlertForm({ stockAlert: product.stockAlert })
                          setEditAlertModal(true)
                        }}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Modifier seuil"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleViewMovements(product)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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
        
        {filteredStocks.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
          </div>
        )}
      </div>

      {/* Modal Adjust */}
      {adjustModal && selectedProduct && (
        <Modal isOpen={adjustModal} onClose={() => setAdjustModal(false)} title={`Ajuster le stock - ${selectedProduct.name}`}>
          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                Stock actuel: <strong>{selectedProduct.stock} {selectedProduct.unit}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité (+ pour ajouter, - pour retirer)
              </label>
              <input
                type="number"
                step="0.01"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: +50 ou -20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Raison</label>
              <textarea
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Ex: Réception fournisseur, Inventaire, Casse..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setAdjustModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Ajuster
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Edit Alert */}
      {editAlertModal && selectedProduct && (
        <Modal isOpen={editAlertModal} onClose={() => setEditAlertModal(false)} title={`Seuil d'alerte - ${selectedProduct.name}`}>
          <form onSubmit={handleUpdateAlert} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seuil d'alerte ({selectedProduct.unit})
              </label>
              <input
                type="number"
                value={alertForm.stockAlert}
                onChange={(e) => setAlertForm({ ...alertForm, stockAlert: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Une alerte sera déclenchée quand le stock descend à ou en dessous de ce seuil
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setEditAlertModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                Mettre à jour
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Movements */}
      {movementsModal && selectedProduct && (
        <Modal isOpen={movementsModal} onClose={() => setMovementsModal(false)} title={`Historique - ${selectedProduct.name}`}>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {movements.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun mouvement enregistré</p>
            ) : (
              movements.map((movement) => (
                <div key={movement.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-semibold ${movement.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity} kg
                      </p>
                      <p className="text-sm text-gray-600">{movement.reference}</p>
                      {movement.shop && <p className="text-xs text-gray-500">{movement.shop}</p>}
                      {movement.notes && <p className="text-xs text-gray-500 mt-1">{movement.notes}</p>}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(movement.date).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Modal Inventory */}
      {inventoryModal && (
        <Modal isOpen={inventoryModal} onClose={() => setInventoryModal(false)} title="Inventaire physique">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Saisissez les quantités physiques comptées pour chaque produit.
            </p>
            
            {filteredStocks.slice(0, 10).map((product) => {
              const item = inventoryItems.find(i => i.productId === product.id)
              return (
                <div key={product.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-gray-500">
                      Système: {product.stock} {product.unit}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Quantité physique"
                    value={item?.physicalCount || ''}
                    onChange={(e) => {
                      const existing = inventoryItems.findIndex(i => i.productId === product.id)
                      const newItems = [...inventoryItems]
                      if (existing >= 0) {
                        newItems[existing].physicalCount = parseFloat(e.target.value) || 0
                      } else {
                        newItems.push({
                          productId: product.id,
                          physicalCount: parseFloat(e.target.value) || 0,
                          notes: ''
                        })
                      }
                      setInventoryItems(newItems)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )
            })}

            <div className="flex gap-3 pt-4">
              <button onClick={() => setInventoryModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={handleInventorySubmit} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Valider l'inventaire
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default StockManagement
