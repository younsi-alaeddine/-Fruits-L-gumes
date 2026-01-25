import React, { useState, useEffect } from 'react'
import { Package, Search, Filter, Tag, AlertTriangle } from 'lucide-react'
import DataTable from '../../components/common/DataTable'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { useStore } from '../../contexts/StoreContext'
import { getProducts } from '../../api/products'
import { getStocks } from '../../api/stocks'

/**
 * Page de gestion des produits - MAGASIN
 * Affiche les produits avec leur stock dans le magasin actif
 */
function StoreProducts() {
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  const { activeStore } = useStore()

  const [products, setProducts] = useState([])
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')

  const activeStoreId = activeStore?.id

  useEffect(() => {
    if (activeStoreId) {
      loadData()
    }
  }, [activeStoreId])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadProducts(), loadStocks()])
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await getProducts()
      setProducts(response.data || [])
    } catch (error) {
      showError('Erreur lors du chargement des produits')
      console.error(error)
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
      console.error(error)
    }
  }

  // Enrichir les produits avec les informations de stock
  const enrichedProducts = products.map((product) => {
    const stock = stocks.find((s) => s.productId === product.id && s.storeId === activeStoreId)
    return {
      ...product,
      stock: stock?.quantity || 0,
      minStock: stock?.minStock || 0,
      maxStock: stock?.maxStock || 0,
      isLowStock: (stock?.quantity || 0) <= (stock?.minStock || 0),
      isOutOfStock: (stock?.quantity || 0) === 0,
    }
  })

  const filteredProducts = enrichedProducts.filter((product) => {
    const matchesSearch =
      !searchQuery ||
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !categoryFilter || product.category === categoryFilter

    const matchesAvailability =
      !availabilityFilter ||
      (availabilityFilter === 'in_stock' && product.stock > 0) ||
      (availabilityFilter === 'low_stock' && product.isLowStock && product.stock > 0) ||
      (availabilityFilter === 'out_of_stock' && product.isOutOfStock)

    return matchesSearch && matchesCategory && matchesAvailability
  })

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort()

  // Statistiques
  const stats = {
    total: enrichedProducts.length,
    inStock: enrichedProducts.filter((p) => p.stock > 0).length,
    lowStock: enrichedProducts.filter((p) => p.isLowStock && p.stock > 0).length,
    outOfStock: enrichedProducts.filter((p) => p.isOutOfStock).length,
  }

  const columns = [
    {
      key: 'name',
      label: 'Produit',
      render: (value, product) => (
        <div>
          <p className="font-semibold text-gray-900">{value}</p>
          {product.sku && (
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Catégorie',
      render: (value, product) => (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Tag className="h-3 w-3" />
          <span>{value}</span>
          {product.subCategory && (
            <span className="text-xs text-gray-500">/ {product.subCategory}</span>
          )}
        </div>
      ),
    },
    {
      key: 'unit',
      label: 'Unité',
      render: (value) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg">
          {value}
        </span>
      ),
    },
    {
      key: 'priceHT',
      label: 'Prix',
      render: (value, product) => {
        const tva = product.tva || 5.5
        const priceTTC = value * (1 + tva / 100)
        return (
          <div>
            <p className="font-bold text-gray-900">{priceTTC.toFixed(2)} €</p>
            <p className="text-xs text-gray-500">HT: {value.toFixed(2)} €</p>
          </div>
        )
      },
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (value, product) => (
        <div>
          <div className="flex items-center space-x-2">
            <Package
              className={`h-4 w-4 ${
                product.isOutOfStock
                  ? 'text-red-600'
                  : product.isLowStock
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}
            />
            <div>
              <p
                className={`font-bold ${
                  product.isOutOfStock
                    ? 'text-red-600'
                    : product.isLowStock
                    ? 'text-orange-600'
                    : 'text-gray-900'
                }`}
              >
                {value.toFixed(2)} {product.unit}
              </p>
              {product.isLowStock && (
                <p className="text-xs text-orange-600 flex items-center space-x-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Stock faible</span>
                </p>
              )}
              {product.isOutOfStock && (
                <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Rupture</span>
                </p>
              )}
            </div>
          </div>
          {product.minStock > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Min: {product.minStock.toFixed(2)} / Max: {product.maxStock.toFixed(2)}
            </p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Produits</h1>
          <p className="text-gray-600">Catalogue des produits et stocks du magasin</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total produits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inStock}</p>
            </div>
            <Package className="h-8 w-8 text-green-600" />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="input"
            >
              <option value="">Tous les statuts</option>
              <option value="in_stock">En stock</option>
              <option value="low_stock">Stock faible</option>
              <option value="out_of_stock">Rupture</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des produits */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        currentPage={1}
        totalPages={1}
        total={filteredProducts.length}
        onPageChange={() => {}}
        loading={loading}
        emptyMessage="Aucun produit trouvé"
      />

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  )
}

export default StoreProducts
