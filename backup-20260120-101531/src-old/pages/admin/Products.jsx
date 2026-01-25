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
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, productId: null })
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subCategory: '',
    unit: 'kg',
    priceHT: '',
    tva: '5.5',
    sku: '',
    isActive: true,
  })

  const categories = [
    'Fruits',
    'Légumes',
    'Herbes aromatiques',
    'Agrumes',
    'Légumes feuilles',
    'Légumes racines',
    'Légumes fruits',
  ]

  const subCategories = {
    'Fruits': ['Pommes', 'Poires', 'Raisins', 'Fruits rouges', 'Fruits exotiques'],
    'Légumes': ['Tomates', 'Courgettes', 'Aubergines', 'Poivrons', 'Carottes'],
    'Herbes aromatiques': ['Basilic', 'Persil', 'Ciboulette', 'Thym', 'Romarin'],
    'Agrumes': ['Oranges', 'Citrons', 'Clémentines', 'Pamplemousses'],
    'Légumes feuilles': ['Salades', 'Épinards', 'Choux', 'Bettes'],
    'Légumes racines': ['Carottes', 'Radis', 'Betteraves', 'Pommes de terre'],
    'Légumes fruits': ['Tomates', 'Courgettes', 'Aubergines', 'Poivrons'],
  }

  const units = ['kg', 'pièce', 'botte', 'tête', 'botte', 'kg (cagette)']

  useEffect(() => {
    loadProducts()
  }, [currentPage])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 20,
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
      }

      const response = await getProducts(params)
      setProducts(response.data || [])
      setTotalPages(response.totalPages || 1)
      setTotal(response.total || 0)
    } catch (error) {
      showError('Erreur lors du chargement des produits')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchQuery !== undefined || categoryFilter !== undefined) {
      const timer = setTimeout(() => {
        setCurrentPage(1)
        loadProducts()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [searchQuery, categoryFilter])

  const handleOpenModal = (product = null) => {
    if (product) {
      setSelectedProduct(product)
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        subCategory: product.subCategory || '',
        unit: product.unit || 'kg',
        priceHT: product.priceHT?.toString() || '',
        tva: product.tva?.toString() || '5.5',
        sku: product.sku || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
      })
    } else {
      setSelectedProduct(null)
      setFormData({
        name: '',
        description: '',
        category: '',
        subCategory: '',
        unit: 'kg',
        priceHT: '',
        tva: '5.5',
        sku: '',
        isActive: true,
      })
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
      const productData = {
        ...formData,
        priceHT: parseFloat(formData.priceHT) || 0,
        tva: parseFloat(formData.tva) || 5.5,
      }

      if (selectedProduct) {
        await updateProduct(selectedProduct.id, productData)
        showSuccess('Produit modifié avec succès')
      } else {
        await createProduct(productData)
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

  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      product.name?.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search)
    )
  })

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
        <div>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Tag className="h-3 w-3" />
            <span className="font-semibold">{value}</span>
          </div>
          {product.subCategory && (
            <p className="text-xs text-gray-500 mt-1">{product.subCategory}</p>
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
                  setCategoryFilter(e.target.value)
                  setCurrentPage(1)
                }}
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
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      category: e.target.value,
                      subCategory: '',
                    })
                  }}
                  className="input"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sous-catégorie
                </label>
                <select
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  className="input"
                  disabled={!formData.category}
                >
                  <option value="">Sélectionner une sous-catégorie</option>
                  {formData.category &&
                    subCategories[formData.category]?.map((subCat) => (
                      <option key={subCat} value={subCat}>
                        {subCat}
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
                  value={formData.tva}
                  onChange={(e) => setFormData({ ...formData, tva: e.target.value })}
                  className="input"
                  required
                >
                  <option value="5.5">5.5%</option>
                  <option value="10">10%</option>
                  <option value="20">20%</option>
                </select>
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
