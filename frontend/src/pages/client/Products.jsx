import React, { useState, useEffect, useMemo } from 'react'
import { Package, Search, Filter, Tag, ShoppingCart, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/common/DataTable'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getProducts } from '../../api/products'
import { getStocks } from '../../api/stocks'
import { getClientShops } from '../../api/stores'

/**
 * Page de vue des produits - CLIENT
 * Affiche tous les produits disponibles avec stocks consolidés de tous les magasins
 */
function ClientProducts() {
  const navigate = useNavigate()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [products, setProducts] = useState([])
  const [stocks, setStocks] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedStoreId, setSelectedStoreId] = useState(null)

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
      await Promise.all([loadProducts(), loadStores(), loadStocks()])
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const res = await getProducts()
      setProducts(res?.products ?? [])
    } catch (error) {
      showError('Erreur lors du chargement des produits')
      console.error(error)
    }
  }

  const loadStores = async () => {
    try {
      const res = await getClientShops({ page: 1, limit: 200 })
      setStores(res?.shops ?? [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadStocks = async () => {
    try {
      const res = await getStocks({ storeId: selectedStoreId || undefined })
      setStocks(res?.products ?? [])
    } catch (error) {
      console.error(error)
    }
  }

  // Consolidation des stocks par produit
  const enrichedProducts = useMemo(() => {
    return products.map((product) => {
      const productStocks = stocks.filter((s) => s.productId === product.id)
      const totalStock = productStocks.reduce((sum, s) => sum + (s.quantity || 0), 0)
      const minStock = Math.min(...productStocks.map((s) => s.quantity || 0), Infinity)
      const maxStock = Math.max(...productStocks.map((s) => s.quantity || 0), 0)
      const hasLowStock = productStocks.some((s) => (s.quantity || 0) <= (s.minStock || 0))
      const hasOutOfStock = productStocks.some((s) => (s.quantity || 0) === 0)

      return {
        ...product,
        totalStock,
        minStock,
        maxStock,
        hasLowStock,
        hasOutOfStock,
        storesCount: productStocks.length,
        stores: productStocks.map((s) => ({
          storeId: s.storeId,
          quantity: s.quantity || 0,
          storeName: stores.find((st) => st.id === s.storeId)?.name || 'Magasin inconnu',
        })),
      }
    })
  }, [products, stocks, stores])

  const filteredProducts = useMemo(() => {
    return enrichedProducts.filter((product) => {
      const matchesSearch =
        !searchQuery ||
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = !categoryFilter || product.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [enrichedProducts, searchQuery, categoryFilter])

  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category).filter(Boolean))].sort()
  }, [products])

  // Statistiques
  const stats = useMemo(() => {
    return {
      total: enrichedProducts.length,
      inStock: enrichedProducts.filter((p) => p.totalStock > 0).length,
      lowStock: enrichedProducts.filter((p) => p.hasLowStock).length,
      outOfStock: enrichedProducts.filter((p) => p.hasOutOfStock).length,
    }
  }, [enrichedProducts])

  const handleCreateOrder = () => {
    navigate('/client/orders/create')
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
      key: 'totalStock',
      label: 'Stock consolidé',
      render: (value, product) => (
        <div>
          <div className="flex items-center space-x-2">
            <Package
              className={`h-4 w-4 ${
                product.hasOutOfStock
                  ? 'text-red-600'
                  : product.hasLowStock
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}
            />
            <div>
              <p
                className={`font-bold ${
                  product.hasOutOfStock
                    ? 'text-red-600'
                    : product.hasLowStock
                    ? 'text-orange-600'
                    : 'text-gray-900'
                }`}
              >
                {value.toFixed(2)} {product.unit}
              </p>
              <p className="text-xs text-gray-500">{product.storesCount} magasin(s)</p>
            </div>
          </div>
          {product.minStock !== Infinity && product.maxStock > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Min: {product.minStock.toFixed(2)} / Max: {product.maxStock.toFixed(2)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'stores',
      label: 'Répartition magasins',
      render: (_, product) => (
        <div className="text-xs text-gray-600">
          {product.stores.slice(0, 3).map((store, index) => (
            <div key={index} className="flex items-center justify-between mb-1">
              <span className="truncate max-w-[120px]">{store.storeName}</span>
              <span className="ml-2 font-semibold text-gray-900">
                {store.quantity.toFixed(2)} {product.unit}
              </span>
            </div>
          ))}
          {product.stores.length > 3 && (
            <p className="text-gray-400 mt-1">+{product.stores.length - 3} autre(s)</p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, product) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCreateOrder}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Créer une commande"
          >
            <ShoppingCart className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Produits</h1>
          <p className="text-gray-600">Catalogue des produits avec stocks consolidés</p>
        </div>
        <button
          onClick={handleCreateOrder}
          className="btn btn-primary flex items-center space-x-2"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Nouvelle commande</span>
        </button>
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
            <Package className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ruptures</p>
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
            </div>
            <Package className="h-8 w-8 text-red-600" />
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
                <option key={cat.id} value={cat.id}>
                  {cat.name}
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

export default ClientProducts
