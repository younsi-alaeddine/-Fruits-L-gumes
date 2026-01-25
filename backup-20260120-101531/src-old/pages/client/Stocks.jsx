import React, { useState, useEffect, useMemo } from 'react'
import { Package, Search, Filter, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import DataTable from '../../components/common/DataTable'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getStores } from '../../api/stores'
import { getStocks } from '../../api/stocks'
import { getProducts } from '../../api/products'

/**
 * Page de vue des stocks consolidés - CLIENT
 * Affiche les stocks de tous les magasins du client de manière consolidée
 */
function ClientStocks() {
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [stores, setStores] = useState([])
  const [products, setProducts] = useState([])
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStoreId, setSelectedStoreId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [lowStockFilter, setLowStockFilter] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedStoreId) {
      loadStocks()
    }
  }, [selectedStoreId])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadStores(), loadProducts()])
      await loadStocks()
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStores = async () => {
    try {
      const response = await getStores()
      setStores(response.data || [])
    } catch (error) {
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

  const loadStocks = async () => {
    try {
      const params = {
        storeId: selectedStoreId || undefined,
      }
      const response = await getStocks(params)
      setStocks(response.data || [])
    } catch (error) {
      showError('Erreur lors du chargement des stocks')
      console.error(error)
    }
  }

  // Consolidation des stocks par produit
  const consolidatedStocks = useMemo(() => {
    const stocksMap = new Map()

    stocks.forEach((stock) => {
      const productId = stock.productId
      const product = products.find((p) => p.id === productId)

      if (!product) return

      if (!stocksMap.has(productId)) {
        stocksMap.set(productId, {
          productId,
          product,
          totalQuantity: 0,
          stores: [],
          averageQuantity: 0,
          minQuantity: Infinity,
          maxQuantity: 0,
          lowStockStores: 0,
        })
      }

      const consolidated = stocksMap.get(productId)
      consolidated.totalQuantity += stock.quantity || 0
      consolidated.stores.push({
        storeId: stock.storeId,
        quantity: stock.quantity || 0,
        minStock: stock.minStock || 0,
        maxStock: stock.maxStock || 0,
        isLowStock: (stock.quantity || 0) <= (stock.minStock || 0),
      })

      consolidated.minQuantity = Math.min(consolidated.minQuantity, stock.quantity || 0)
      consolidated.maxQuantity = Math.max(consolidated.maxQuantity, stock.quantity || 0)

      if ((stock.quantity || 0) <= (stock.minStock || 0)) {
        consolidated.lowStockStores += 1
      }
    })

    // Calculer la moyenne
    stocksMap.forEach((consolidated) => {
      consolidated.averageQuantity = consolidated.totalQuantity / consolidated.stores.length
    })

    return Array.from(stocksMap.values())
  }, [stocks, products])

  const filteredStocks = useMemo(() => {
    return consolidatedStocks.filter((stock) => {
      const matchesSearch =
        !searchQuery ||
        stock.product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.product.sku?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = !categoryFilter || stock.product.category === categoryFilter

      const matchesLowStock = !lowStockFilter || stock.lowStockStores > 0

      return matchesSearch && matchesCategory && matchesLowStock
    })
  }, [consolidatedStocks, searchQuery, categoryFilter, lowStockFilter])

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [products])

  // Statistiques
  const stats = useMemo(() => {
    const totalProducts = consolidatedStocks.length
    const totalQuantity = consolidatedStocks.reduce((sum, s) => sum + s.totalQuantity, 0)
    const lowStockProducts = consolidatedStocks.filter((s) => s.lowStockStores > 0).length
    const outOfStockProducts = consolidatedStocks.filter((s) => s.totalQuantity === 0).length

    return {
      totalProducts,
      totalQuantity,
      lowStockProducts,
      outOfStockProducts,
    }
  }, [consolidatedStocks])

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
          <p className="text-xs text-gray-500 mt-1">{stock.product.category}</p>
        </div>
      ),
    },
    {
      key: 'totalQuantity',
      label: 'Stock total',
      render: (value, stock) => (
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-gray-400" />
          <div>
            <p className="font-bold text-gray-900">
              {value.toFixed(2)} {stock.product.unit}
            </p>
            <p className="text-xs text-gray-500">{stock.stores.length} magasin(s)</p>
          </div>
        </div>
      ),
    },
    {
      key: 'averageQuantity',
      label: 'Moyenne',
      render: (value, stock) => (
        <p className="text-sm text-gray-600">
          {value.toFixed(2)} {stock.product.unit}
        </p>
      ),
    },
    {
      key: 'range',
      label: 'Min / Max',
      render: (_, stock) => (
        <div className="text-sm">
          <div className="flex items-center space-x-1 text-red-600">
            <TrendingDown className="h-3 w-3" />
            <span>{stock.minQuantity.toFixed(2)}</span>
          </div>
          <div className="flex items-center space-x-1 text-green-600 mt-1">
            <TrendingUp className="h-3 w-3" />
            <span>{stock.maxQuantity.toFixed(2)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'lowStockStores',
      label: 'Stock faible',
      render: (value, stock) => (
        <div>
          {value > 0 ? (
            <div className="flex items-center space-x-1 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-semibold">{value} magasin(s)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-green-600">
              <Minus className="h-4 w-4" />
              <span className="text-sm">OK</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'stores',
      label: 'Détails magasins',
      render: (_, stock) => (
        <div className="text-xs text-gray-600">
          {stock.stores.slice(0, 3).map((store, index) => {
            const storeName = stores.find((s) => s.id === store.storeId)?.name || store.storeId
            return (
              <div key={index} className="flex items-center justify-between mb-1">
                <span className="truncate max-w-[120px]">{storeName}</span>
                <span
                  className={`ml-2 font-semibold ${
                    store.isLowStock ? 'text-orange-600' : 'text-gray-900'
                  }`}
                >
                  {store.quantity} {stock.product.unit}
                </span>
              </div>
            )
          })}
          {stock.stores.length > 3 && (
            <p className="text-gray-400 mt-1">+{stock.stores.length - 3} autre(s)</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stocks Consolidés</h1>
          <p className="text-gray-600">Vue consolidée des stocks de tous vos magasins</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Produits en stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ruptures</p>
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStockProducts}</p>
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
          <div>
            <select
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value || null)}
              className="input"
            >
              <option value="">Tous les magasins</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
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

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  )
}

export default ClientStocks
