import React, { useState, useEffect } from 'react'
import { Package, Search, Plus, Edit2, Trash2, Filter, Tag } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermission } from '../../hooks/usePermission'
import { RESOURCES, ACTIONS } from '../../constants/permissions'
import ProtectedRoute from '../../components/common/ProtectedRoute'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/products'
import apiClient from '../../config/api'

/**
 * Page de gestion des produits - ADMIN
 * Catalogue produits avec catégories et sous-catégories
 */
function AdminProducts() {
  const { user } = useAuth()
  const { canCreate, canUpdate, canDelete } = usePermission(RESOURCES.PRODUCTS)
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [subCategoryFilter, setSubCategoryFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, productId: null })
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    subCategoryId: '',
    unit: 'kg',
    priceHT: '',
    priceHT_T2: '',
    tvaRate: '5.5',
    sku: '',
    photoUrl: '',
    origin: '',
    packaging: '',
    presentation: '',
    margin: '',
    cessionPrice: '',
    pvc: '',
    gencod: '',
    barcode: '',
    stock: '',
    isActive: true,
  })
  const [photoFile, setPhotoFile] = useState(null)

  // Catégories et sous-catégories dynamiques (chargées depuis la base de données)
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Doit correspondre à l'enum backend Unit: kg, caisse, piece, botte
  const units = ['kg', 'caisse', 'piece', 'botte']

  useEffect(() => {
    loadProducts()
  }, [currentPage])

  useEffect(() => {
    loadCategories()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 20,
        category: categoryFilter || undefined,
        subCategory: subCategoryFilter || undefined,
        search: searchQuery || undefined,
      }

      const response = await getProducts(params)
      setProducts(response.products || [])
      setTotalPages(response.pagination?.totalPages || 1)
      setTotal(response.pagination?.total || 0)
    } catch (error) {
      showError('Erreur lors du chargement des produits')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchQuery !== undefined || categoryFilter !== undefined || subCategoryFilter !== undefined) {
      const timer = setTimeout(() => {
        setCurrentPage(1)
        loadProducts()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [searchQuery, categoryFilter, subCategoryFilter])

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)
      const response = await apiClient.get('/categories')
      const cats = response.data.categories || []
      // S'assurer qu'on a des objets simples sans références circulaires
      setCategories(cats.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color
      })))
    } catch (error) {
      console.error('Erreur chargement catégories:', error)
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadSubCategories = async (categoryId) => {
    if (!categoryId) {
      setSubCategories([])
      return
    }
    try {
      const response = await apiClient.get(`/categories/${categoryId}/subcategories`)
      const subs = response.data.subCategories || []
      // S'assurer qu'on a des objets simples
      setSubCategories(subs.map(sub => ({
        id: sub.id,
        name: sub.name,
        icon: sub.icon
      })))
    } catch (error) {
      console.error('Erreur chargement sous-catégories:', error)
      setSubCategories([])
    }
  }

  const handleOpenModal = (product = null) => {
    if (product) {
      setSelectedProduct(product)
      const categoryId = product.categoryId || product.customCategory?.id || ''
      const subCategoryId = product.subCategoryId || product.customSubCategory?.id || ''
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        categoryId: categoryId,
        subCategoryId: subCategoryId,
        unit: product.unit || 'kg',
        priceHT: product.priceHT?.toString() || '',
        priceHT_T2: product.priceHT_T2?.toString() || '',
        tvaRate: (product.tvaRate ?? 5.5).toString(),
        sku: product.sku || '',
        origin: product.origin || '',
        packaging: product.packaging || '',
        presentation: product.presentation || '',
        margin: product.margin?.toString() || '',
        cessionPrice: product.cessionPrice?.toString() || '',
        pvc: product.pvc?.toString() || '',
        gencod: product.gencod || '',
        barcode: product.barcode || '',
        stock: product.stock?.toString() || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
      })
      
      // Charger les sous-catégories si une catégorie est sélectionnée
      if (categoryId) {
        loadSubCategories(categoryId)
      }
    } else {
      setSelectedProduct(null)
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        subCategoryId: '',
        unit: 'kg',
        priceHT: '',
        priceHT_T2: '',
        tvaRate: '5.5',
        sku: '',
        photoUrl: '',
        origin: '',
        packaging: '',
        presentation: '',
        margin: '',
        cessionPrice: '',
        pvc: '',
        gencod: '',
        barcode: '',
        stock: '',
        isActive: true,
      })
      setPhotoFile(null)
      setSubCategories([])
    }
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedProduct(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Validation des prix
      const priceHT = parseFloat(formData.priceHT) || 0
      const priceHT_T2 = parseFloat(formData.priceHT_T2) || 0
      const tvaRate = parseFloat(formData.tvaRate) || 5.5
      const stock = parseInt(formData.stock) || 0
      const margin = formData.margin !== '' ? (parseFloat(formData.margin) || 0) : ''
      const cessionPrice = formData.cessionPrice !== '' ? (parseFloat(formData.cessionPrice) || 0) : ''
      const pvc = formData.pvc !== '' ? (parseFloat(formData.pvc) || 0) : ''

      if (priceHT < 0 || priceHT_T2 < 0) {
        showError('Les prix ne peuvent pas être négatifs')
        return
      }
      if (tvaRate < 0 || tvaRate > 100) {
        showError('Le taux de TVA doit être entre 0 et 100%')
        return
      }

      const productData = new FormData()
      
      // Ajouter tous les champs texte
      Object.keys(formData).forEach(key => {
        if (key !== 'photoUrl' && formData[key] !== '') {
          productData.append(key, formData[key])
        }
      })
      
      // Ajouter les valeurs numériques converties
      productData.set('priceHT', priceHT)
      productData.set('priceHT_T2', priceHT_T2)
      productData.set('tvaRate', tvaRate)
      productData.set('stock', stock)

      // Ajouter la photo si elle existe
      if (photoFile) {
        productData.append('photo', photoFile)
      }

      // Normaliser les champs numériques et noms attendus par le backend
      if (selectedProduct) {
        productData.set('priceHT', priceHT)
        productData.set('priceHT_T2', priceHT_T2)
        productData.set('tvaRate', tvaRate)
        productData.set('stock', stock)
        if (margin !== '') productData.set('margin', margin)
        if (cessionPrice !== '') productData.set('cessionPrice', cessionPrice)
        if (pvc !== '') productData.set('pvc', pvc)
        await apiClient.put(`/products/${selectedProduct.id}`, productData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        showSuccess('Produit modifié avec succès')
      } else {
        productData.set('priceHT', priceHT)
        productData.set('priceHT_T2', priceHT_T2)
        productData.set('tvaRate', tvaRate)
        productData.set('stock', stock)
        if (margin !== '') productData.set('margin', margin)
        if (cessionPrice !== '') productData.set('cessionPrice', cessionPrice)
        if (pvc !== '') productData.set('pvc', pvc)
        await apiClient.post('/products', productData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        showSuccess('Produit créé avec succès')
      }
      handleCloseModal()
      loadProducts()
    } catch (error) {
      showError(selectedProduct ? 'Erreur lors de la modification' : 'Erreur lors de la création')
      console.error(error)
    }
  }

  const handleDelete = async (productId) => {
    try {
      await deleteProduct(productId)
      showSuccess('Produit supprimé avec succès')
      loadProducts()
    } catch (error) {
      showError('Erreur lors de la suppression')
      console.error(error)
    }
    setDeleteDialog({ isOpen: false, productId: null })
  }

  const handleExportCSV = () => {
    try {
      // Préparer les données pour l'export
      const csvData = filteredProducts.map(product => ({
        'Nom': product.name,
        'SKU': product.sku || '',
        'Description': product.description || '',
        'Catégorie': product.customCategory?.name || product.category || '',
        'Sous-catégorie': product.customSubCategory?.name || product.subCategory || '',
        'Unité': product.unit,
        'Prix HT': product.priceHT?.toFixed(2) || '0.00',
        'Prix HT T2': product.priceHT_T2?.toFixed(2) || '',
        'TVA (%)': product.tvaRate ?? '5.5',
        'Stock': product.stock || '0',
        'Origine': product.origin || '',
        'Packaging': product.packaging || '',
        'Présentation': product.presentation || '',
        'Marge (%)': product.margin ?? '',
        'Prix de cession': product.cessionPrice ?? '',
        'PVC': product.pvc ?? '',
        'GENCOD': product.gencod || '',
        'Code-barres': product.barcode || '',
        'Actif': product.isActive ? 'Oui' : 'Non',
      }))

      // Créer le CSV
      const headers = Object.keys(csvData[0] || {})
      const csvContent = [
        headers.join(';'),
        ...csvData.map(row => headers.map(h => `"${row[h]}"`).join(';'))
      ].join('\n')

      // Télécharger le fichier
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `produits_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      showSuccess(`${csvData.length} produits exportés avec succès`)
    } catch (error) {
      showError('Erreur lors de l\'export')
      console.error(error)
    }
  }

  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      product.name?.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search) ||
      product.gencod?.toLowerCase().includes(search) ||
      product.barcode?.toLowerCase().includes(search) ||
      product.origin?.toLowerCase().includes(search)
    )
  })

  const uploadImgSrc = (url) => {
    if (!url || typeof url !== 'string') return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return base + (url.startsWith('/') ? url : `/${url}`)
  }

  const columns = [
    {
      key: 'photoUrl',
      label: 'Photo',
      render: (value, product) => {
        const src = uploadImgSrc(value)
        return (
          <div className="flex items-center justify-center">
            {src ? (
              <img
                src={src}
                alt={product.name || ''}
                className="h-12 w-12 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'name',
      label: 'Produit',
      render: (value, product) => (
        <div>
          <p className="font-semibold text-gray-900">{value}</p>
          {product.sku && (
            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
          )}
          {product.gencod && (
            <p className="text-xs text-gray-400">GENCOD: {product.gencod}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Catégorie',
      render: (value, product) => (
        <div>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Tag className="h-3 w-3" />
            <span className="font-semibold">
              {product.customCategory?.name || value || 'Non classé'}
            </span>
          </div>
          {(product.customSubCategory?.name || product.subCategory) && (
            <p className="text-xs text-gray-500 mt-1">
              {product.customSubCategory?.name || product.subCategory}
            </p>
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
        const tvaRate = product.tvaRate != null && !Number.isNaN(product.tvaRate) ? product.tvaRate : 5.5
        const ht = (value != null && !Number.isNaN(value)) ? Number(value) : 0
        const priceTTC = ht * (1 + tvaRate / 100)
        return (
          <div>
            <p className="font-bold text-gray-900">{priceTTC.toFixed(2)} €</p>
            <p className="text-xs text-gray-500">HT: {ht.toFixed(2)} €</p>
            {product.priceHT_T2 != null && !Number.isNaN(product.priceHT_T2) && (
              <p className="text-xs text-blue-600">T2: {Number(product.priceHT_T2).toFixed(2)} € HT</p>
            )}
          </div>
        )
      },
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (value, product) => {
        const stock = product.totalShopStock ?? value ?? product.stock ?? 0
        const num = Number(stock)
        const s = Number.isNaN(num) ? 0 : num
        const isLow = s > 0 && s <= 10
        const isEmpty = s === 0
        return (
          <div className="flex items-center space-x-2">
            <span className={`font-bold ${isEmpty ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-green-600'}`}>
              {s}
            </span>
            {isEmpty && (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                Rupture
              </span>
            )}
            {isLow && !isEmpty && (
              <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                Faible
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'isActive',
      label: 'Statut',
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            value
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {value ? 'Actif' : 'Inactif'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, product) => (
        <div className="flex items-center space-x-2">
          {canUpdate && (
            <button
              onClick={() => handleOpenModal(product)}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setDeleteDialog({ isOpen: true, productId: product.id })}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredRole="ADMIN" requiredResource={RESOURCES.PRODUCTS} requiredAction={ACTIONS.READ}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Produits</h1>
            <p className="text-gray-600">Catalogue produits avec catégories et sous-catégories</p>
          </div>
          {canCreate && (
            <button
              onClick={() => handleOpenModal()}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau produit</span>
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit (nom, SKU, description)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  const newCategoryId = e.target.value
                  setCategoryFilter(newCategoryId)
                  setSubCategoryFilter('')
                  setCurrentPage(1)
                  if (newCategoryId) {
                    loadSubCategories(newCategoryId)
                  } else {
                    setSubCategories([])
                  }
                }}
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
            <div className="relative">
              <select
                value={subCategoryFilter}
                onChange={(e) => {
                  setSubCategoryFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="input"
                disabled={!categoryFilter || subCategories.length === 0}
              >
                <option value="">Toutes les sous-catégories</option>
                {subCategories.map((subCat) => (
                  <option key={subCat.id} value={subCat.id}>
                    {subCat.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary flex items-center space-x-2"
              title="Exporter en CSV"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tableau */}
        <DataTable
          data={filteredProducts}
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          loading={loading}
          emptyMessage="Aucun produit trouvé"
        />

        {/* Modal création/édition */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title={selectedProduct ? 'Modifier le produit' : 'Nouveau produit'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SKU (Code produit)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="input"
                  placeholder="ex: FRUIT-POMME-001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => {
                    const categoryId = e.target.value
                    setFormData({
                      ...formData,
                      categoryId: categoryId,
                      subCategoryId: '',
                    })
                    loadSubCategories(categoryId)
                  }}
                  className="input"
                  required
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories ? 'Chargement...' : 'Sélectionner une catégorie'}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sous-catégorie
                </label>
                <select
                  value={formData.subCategoryId}
                  onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
                  className="input"
                  disabled={!formData.categoryId || subCategories.length === 0}
                >
                  <option value="">
                    {!formData.categoryId 
                      ? 'Sélectionnez d\'abord une catégorie' 
                      : subCategories.length === 0 
                        ? 'Aucune sous-catégorie' 
                        : 'Optionnel'}
                  </option>
                  {subCategories.map((subCat) => (
                    <option key={subCat.id} value={subCat.id}>
                      {subCat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unité *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="input"
                  required
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prix HT (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.priceHT}
                  onChange={(e) => setFormData({ ...formData, priceHT: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  TVA (%) *
                </label>
                <select
                  value={formData.tvaRate}
                  onChange={(e) => setFormData({ ...formData, tvaRate: e.target.value })}
                  className="input"
                  required
                >
                  <option value="5.5">5.5%</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prix HT Tarif 2 (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.priceHT_T2}
                  onChange={(e) => setFormData({ ...formData, priceHT_T2: e.target.value })}
                  className="input"
                  placeholder="Prix pour tarif 2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock initial
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="input"
                  placeholder="Quantité en stock"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">📸 Photo du produit</h3>
              <div className="space-y-3">
                {formData.photoUrl && !photoFile && uploadImgSrc(formData.photoUrl) && (
                  <div className="flex items-center space-x-3">
                    <img
                      src={uploadImgSrc(formData.photoUrl)}
                      alt="Photo actuelle"
                      className="h-20 w-20 object-cover rounded-lg border"
                    />
                    <span className="text-sm text-gray-600">Photo actuelle</span>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          showError('La taille de l\'image ne doit pas dépasser 5MB')
                          e.target.value = ''
                          return
                        }
                        setPhotoFile(file)
                      }
                    }}
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG (max 5MB)</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">📋 Informations avancées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Origine
                  </label>
                  <select
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="input"
                  >
                    <option value="">Non renseigné</option>
                    <option value="FRANCE">France</option>
                    <option value="ESPAGNE">Espagne</option>
                    <option value="MAROC">Maroc</option>
                    <option value="PORTUGAL">Portugal</option>
                    <option value="ITALIE">Italie</option>
                    <option value="BELGIQUE">Belgique</option>
                    <option value="PAYS_BAS">Pays-Bas</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Packaging
                  </label>
                  <select
                    value={formData.packaging}
                    onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                    className="input"
                  >
                    <option value="">Non renseigné</option>
                    <option value="KG">KG</option>
                    <option value="UC">UC</option>
                    <option value="BAR">BAR</option>
                    <option value="SAC">SAC</option>
                    <option value="PCE">PCE</option>
                    <option value="FIL">FIL</option>
                    <option value="BOTTE">BOTTE</option>
                    <option value="CAISSE">CAISSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Présentation
                  </label>
                  <select
                    value={formData.presentation}
                    onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
                    className="input"
                  >
                    <option value="">Non renseigné</option>
                    <option value="PCE">PCE</option>
                    <option value="SAC">SAC</option>
                    <option value="BAR">BAR</option>
                    <option value="KGS">KGS</option>
                    <option value="FIL">FIL</option>
                    <option value="BOTTE">BOTTE</option>
                    <option value="CAISSE">CAISSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Marge (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.margin}
                    onChange={(e) => setFormData({ ...formData, margin: e.target.value })}
                    className="input"
                    placeholder="ex: 12.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prix de cession (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cessionPrice}
                    onChange={(e) => setFormData({ ...formData, cessionPrice: e.target.value })}
                    className="input"
                    placeholder="ex: 1.20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    PVC (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pvc}
                    onChange={(e) => setFormData({ ...formData, pvc: e.target.value })}
                    className="input"
                    placeholder="ex: 2.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    GENCOD
                  </label>
                  <input
                    type="text"
                    value={formData.gencod}
                    onChange={(e) => setFormData({ ...formData, gencod: e.target.value })}
                    className="input"
                    placeholder="Code GENCOD/EAN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Code-barres
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="input"
                    placeholder="Code-barres interne"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-semibold text-gray-700">Produit actif</span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                {selectedProduct ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Dialog de suppression */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, productId: null })}
          onConfirm={() => handleDelete(deleteDialog.productId)}
          title="Supprimer le produit"
          message="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible."
          confirmText="Supprimer"
          type="danger"
        />

        {/* Toast */}
        <Toast {...toast} onClose={hideToast} />
      </div>
    </ProtectedRoute>
  )
}

export default AdminProducts
