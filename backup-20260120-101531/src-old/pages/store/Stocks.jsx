import React, { useState, useEffect } from 'react'
import { Package, Search, Filter, Plus, Edit2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { useStore } from '../../contexts/StoreContext'
import { getStocks, updateStock, createStock } from '../../api/stocks'
import { getProducts } from '../../api/products'

/**
 * Page de gestion des stocks - MAGASIN
 * Permet de gérer les stocks du magasin actif
 */
function StoreStocks() {
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  const { activeStore } = useStore()

  const [stocks, setStocks] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState(null)
  const [formData, setFormData] = useState({
    quantity: '',
    minStock: '',
    maxStock: '',
  })

  const activeStoreId = activeStore?.id

  useEffect(() => {
    if (activeStoreId) {
      loadData()
    }
  }, [activeStoreId])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadStocks(), loadProducts()])
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStocks = async () => {
    try {
      const params = {
        storeId: activeStoreId,
      }
      const response = await getStocks(params)
      setStocks(response.data || [])
    } catch (error) {
      showError('Erreur lors du chargement des stocks')
      console.error(error)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await getProducts()
      setProducts(response.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleOpenModal = (stock = null) => {
    if (stock) {
      setSelectedStock(stock)
      setFormData({
        quantity: stock.quantity?.toString() || '',
        minStock: stock.minStock?.toString() || '',
        maxStock: stock.maxStock?.toString() || '',
      })
    } else {
      setSelectedStock(null)
      setFormData({
        quantity: '',
        minStock: '',
        maxStock: '',
      })
    }
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedStock(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const stockData = {
        quantity: parseFloat(formData.quantity) || 0,
        minStock: parseFloat(formData.minStock) || 0,
        maxStock: parseFloat(formData.maxStock) || 0,
      }

      if (selectedStock) {
        await updateStock(selectedStock.id, stockData)
        showSuccess('Stock modifié avec succès')
      } else {
        // Créer un nouveau stock nécessiterait productId
        showError('La création de stock doit être faite depuis la page produits')
      }
      handleCloseModal()
      loadStocks()
    } catch (error) {
      showError('Erreur lors de la mise à jour du stock')
      console.error(error)
    }
  }

  // Enrichir les stocks avec les informations produits
  const enrichedStocks = stocks.map((stock) => {
    const product = products.find((p) => p.id === stock.productId)
    return {
      ...stock,
      product: product || { name: 'Produit inconnu', unit: 'kg', category: '' },
      isLowStock: (stock.quantity || 0) <= (stock.minStock || 0),
      isOutOfStock: (stock.quantity || 0) === 0,
    }
  })

  const filteredStocks = enrichedStocks.filter((stock) => {
    const matchesSearch =
      !searchQuery ||
      stock.product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.product.sku?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !categoryFilter || stock.product.category === categoryFilter

    const matchesLowStock = !lowStockFilter || stock.isLowStock

    return matchesSearch && matchesCategory && matchesLowStock
  })

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort()

  // Statistiques
  const stats = {
    total: enrichedStocks.length,
    totalQuantity: enrichedStocks.reduce((sum, s) => sum + (s.quantity || 0), 0),
    lowStock: enrichedStocks.filter((s) => s.isLowStock && !s.isOutOfStock).length,
    outOfStock: enrichedStocks.filter((s) => s.isOutOfStock).length,
  }

  const columns = [
    {
      key: 'product',
      label: 'Produit',
      render: (_, stock) => (
        <div>
          <p className="font-semibold text-gray-900">{stock.product.name}</p>
          {stock.product.sku && (
            <p className="text-xs text-gray-500">SKU: {stock.product.sku}</p>
          )}
          {stock.product.category && (
            <p className="text-xs text-gray-500 mt-1">{stock.product.category}</p>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Stock actuel',
      render: (value, stock) => (
        <div>
          <div className="flex items-center space-x-2">
            <Package
              className={`h-4 w-4 ${
                stock.isOutOfStock
                  ? 'text-red-600'
                  : stock.isLowStock
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}
            />
            <div>
              <p
                className={`font-bold ${
                  stock.isOutOfStock
                    ? 'text-red-600'
                    : stock.isLowStock
                    ? 'text-orange-600'
                    : 'text-gray-900'
                }`}
              >
                {value.toFixed(2)} {stock.product.unit}
              </p>
              {stock.isLowStock && (
                <p className="text-xs text-orange-600 flex items-center space-x-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Stock faible</span>
                </p>
              )}
              {stock.isOutOfStock && (
                <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Rupture</span>
                </p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'minStock',
      label: 'Stock minimum',
      render: (value, stock) => (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <TrendingDown className="h-4 w-4 text-red-400" />
          <span>{value.toFixed(2)} {stock.product.unit}</span>
        </div>
      ),
    },
    {
      key: 'maxStock',
      label: 'Stock maximum',
      render: (value, stock) => (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <span>{value.toFixed(2)} {stock.product.unit}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (_, stock) => {
        const percentage = stock.maxStock > 0 
          ? ((stock.quantity / stock.maxStock) * 100).toFixed(0)
          : 0

        return (
          <div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full ${
                  stock.isOutOfStock
                    ? 'bg-red-500'
                    : stock.isLowStock
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{percentage}%</p>
          </div>
        )
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, stock) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenModal(stock)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Modifier le stock"
          >
            <Edit2 className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Stocks</h1>
          <p className="text-gray-600">Gérer les stocks du magasin</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Produits en stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Quantité totale</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuantity.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Stocks faibles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ruptures</p>
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input pl-10"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="lowStockFilter"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="lowStockFilter" className="text-sm text-gray-700">
              Afficher uniquement les stocks faibles
            </label>
          </div>
        </div>
      </div>

      {/* Tableau des stocks */}
      <DataTable
        data={filteredStocks}
        columns={columns}
        currentPage={1}
        totalPages={1}
        total={filteredStocks.length}
        onPageChange={() => {}}
        loading={loading}
        emptyMessage="Aucun stock trouvé"
      />

      {/* Modal de modification */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={selectedStock ? 'Modifier le stock' : 'Nouveau stock'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {selectedStock && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Produit</p>
              <p className="font-semibold text-gray-900">
                {selectedStock.product?.name || 'Produit inconnu'}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantité actuelle *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock minimum *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock maximum *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.maxStock}
                onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  )
}

export default StoreStocks
