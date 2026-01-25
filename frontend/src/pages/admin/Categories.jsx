import React, { useState, useEffect } from 'react'
import { Tag, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, Search, ArrowUp, ArrowDown, Copy, Power, Package } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import Modal from '../../components/common/Modal'
import apiClient from '../../config/api'

function Categories() {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [subModalOpen, setSubModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSubCategory, setEditingSubCategory] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [subImageFile, setSubImageFile] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', icon: '', color: '', imageUrl: '', isActive: true })
  const [subFormData, setSubFormData] = useState({ name: '', description: '', icon: '', imageUrl: '', isActive: true })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/categories')
      const categoriesData = response.data.categories || []
      
      // Charger les sous-catégories pour chaque catégorie
      const categoriesWithSubs = await Promise.all(
        categoriesData.map(async (category) => {
          try {
            const subResponse = await apiClient.get(`/categories/${category.id}/subcategories`)
            return {
              ...category,
              subCategories: subResponse.data.subCategories || []
            }
          } catch (error) {
            console.error(`Erreur chargement sous-catégories pour ${category.name}:`, error)
            return { ...category, subCategories: [] }
          }
        })
      )
      
      setCategories(categoriesWithSubs)
    } catch (error) {
      showError('Erreur lors du chargement des catégories')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation unicité du nom
    const isDuplicate = categories.some(cat => 
      cat.name.toLowerCase() === formData.name.toLowerCase() && 
      cat.id !== editingCategory?.id
    )
    if (isDuplicate) {
      showError('Une catégorie avec ce nom existe déjà')
      return
    }
    
    try {
      const data = new FormData()
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          data.append(key, formData[key])
        }
      })
      
      if (imageFile) {
        data.append('image', imageFile)
      }
      
      if (editingCategory) {
        await apiClient.put(`/categories/${editingCategory.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        showSuccess('Catégorie modifiée avec succès')
      } else {
        await apiClient.post('/categories', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        showSuccess('Catégorie créée avec succès')
      }
      setModalOpen(false)
      setEditingCategory(null)
      setImageFile(null)
      setFormData({ name: '', description: '', icon: '', color: '', imageUrl: '', isActive: true })
      loadCategories()
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de l\'enregistrement')
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '',
      imageUrl: category.imageUrl || '',
      isActive: category.isActive !== undefined ? category.isActive : true
    })
    setImageFile(null)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    const category = categories.find(c => c.id === id)
    const productCount = category?._count?.products || 0
    
    if (productCount > 0) {
      if (!window.confirm(`Cette catégorie contient ${productCount} produit(s). Êtes-vous sûr de vouloir la supprimer ?`)) return
    } else {
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return
    }
    
    try {
      await apiClient.delete(`/categories/${id}`)
      showSuccess('Catégorie supprimée')
      loadCategories()
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de la suppression')
    }
  }
  
  const handleToggleActive = async (id, currentStatus) => {
    try {
      await apiClient.put(`/categories/${id}`, { isActive: !currentStatus })
      showSuccess(`Catégorie ${!currentStatus ? 'activée' : 'désactivée'}`)
      loadCategories()
    } catch (error) {
      showError('Erreur lors de la modification')
    }
  }
  
  const handleDuplicate = async (category) => {
    try {
      const newName = `${category.name} (copie)`
      const data = {
        name: newName,
        description: category.description,
        icon: category.icon,
        color: category.color,
        imageUrl: category.imageUrl,
        isActive: category.isActive,
        order: categories.length
      }
      await apiClient.post('/categories', data)
      showSuccess('Catégorie dupliquée avec succès')
      loadCategories()
    } catch (error) {
      showError('Erreur lors de la duplication')
    }
  }
  
  const handleMoveOrder = async (id, direction) => {
    const index = categories.findIndex(c => c.id === id)
    if (index === -1) return
    
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === categories.length - 1) return
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const category = categories[index]
    const targetCategory = categories[targetIndex]
    
    try {
      await Promise.all([
        apiClient.put(`/categories/${category.id}`, { order: targetCategory.order }),
        apiClient.put(`/categories/${targetCategory.id}`, { order: category.order })
      ])
      loadCategories()
    } catch (error) {
      showError('Erreur lors du réordonnancement')
    }
  }
  
  const handleExportCSV = () => {
    try {
      const csvData = categories.map(cat => ({
        'Nom': cat.name,
        'Description': cat.description || '',
        'Icon': cat.icon || '',
        'Couleur': cat.color || '',
        'Ordre': cat.order || 0,
        'Actif': cat.isActive ? 'Oui' : 'Non',
        'Sous-catégories': cat._count?.subCategories || 0,
        'Produits': cat._count?.products || 0
      }))
      
      const headers = Object.keys(csvData[0] || {})
      const csvContent = [
        headers.join(';'),
        ...csvData.map(row => headers.map(h => `"${row[h]}"`).join(';'))
      ].join('\n')
      
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `categories_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      showSuccess(`${csvData.length} catégories exportées`)
    } catch (error) {
      showError('Erreur lors de l\'export')
    }
  }

  // Gestion des sous-catégories
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const handleAddSubCategory = (category) => {
    setSelectedCategory(category)
    setEditingSubCategory(null)
    setSubFormData({ name: '', description: '', icon: '' })
    setSubModalOpen(true)
  }

  const handleEditSubCategory = (category, subCategory) => {
    setSelectedCategory(category)
    setEditingSubCategory(subCategory)
    setSubFormData({
      name: subCategory.name,
      description: subCategory.description || '',
      icon: subCategory.icon || ''
    })
    setSubModalOpen(true)
  }

  const handleSubCategorySubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSubCategory) {
        await apiClient.put(`/categories/subcategories/${editingSubCategory.id}`, subFormData)
        showSuccess('Sous-catégorie modifiée avec succès')
      } else {
        await apiClient.post(`/categories/${selectedCategory.id}/subcategories`, subFormData)
        showSuccess('Sous-catégorie créée avec succès')
      }
      setSubModalOpen(false)
      setEditingSubCategory(null)
      setSelectedCategory(null)
      setSubFormData({ name: '', description: '', icon: '' })
      loadCategories()
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de l\'enregistrement')
    }
  }

  const handleDeleteSubCategory = async (subCategoryId, subCategory) => {
    const productCount = subCategory?._count?.products || 0
    
    if (productCount > 0) {
      if (!window.confirm(`Cette sous-catégorie contient ${productCount} produit(s). Êtes-vous sûr de vouloir la supprimer ?`)) return
    } else {
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?')) return
    }
    
    try {
      await apiClient.delete(`/categories/subcategories/${subCategoryId}`)
      showSuccess('Sous-catégorie supprimée avec succès')
      loadCategories()
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de la suppression')
    }
  }
  
  const handleToggleSubActive = async (id, currentStatus) => {
    try {
      await apiClient.put(`/categories/subcategories/${id}`, { isActive: !currentStatus })
      showSuccess(`Sous-catégorie ${!currentStatus ? 'activée' : 'désactivée'}`)
      loadCategories()
    } catch (error) {
      showError('Erreur lors de la modification')
    }
  }

  const openCreateModal = () => {
    setEditingCategory(null)
    setImageFile(null)
    setFormData({ name: '', description: '', icon: '', color: '', imageUrl: '', isActive: true })
    setModalOpen(true)
  }
  
  const filteredCategories = categories.filter((category) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    const matchCategory = category.name?.toLowerCase().includes(search) ||
                         category.description?.toLowerCase().includes(search)
    const matchSubCategory = category.subCategories?.some(sub =>
      sub.name?.toLowerCase().includes(search) ||
      sub.description?.toLowerCase().includes(search)
    )
    return matchCategory || matchSubCategory
  })
  
  const totalSubCategories = categories.reduce((sum, cat) => sum + (cat._count?.subCategories || 0), 0)
  const totalProducts = categories.reduce((sum, cat) => sum + (cat._count?.products || 0), 0)

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => showToast(null)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Gestion des Catégories
          </h1>
          <p className="text-gray-600 mt-2">Gérez les catégories et sous-catégories de produits</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center space-x-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>
          <button onClick={openCreateModal} className="btn-primary flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Nouvelle Catégorie</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Total Catégories</p>
              <p className="text-3xl font-bold text-blue-600">{categories.length}</p>
            </div>
            <Tag className="h-12 w-12 text-blue-400" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Sous-catégories</p>
              <p className="text-3xl font-bold text-purple-600">{totalSubCategories}</p>
            </div>
            <Tag className="h-12 w-12 text-purple-400" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Produits Total</p>
              <p className="text-3xl font-bold text-green-600">{totalProducts}</p>
            </div>
            <Package className="h-12 w-12 text-green-400" />
          </div>
        </div>
      </div>
      
      {/* Barre de recherche */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une catégorie ou sous-catégorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Liste des catégories */}
      <div className="space-y-4">
        {filteredCategories.map((category, index) => (
          <div key={category.id} className="card border-2 hover:shadow-lg transition-shadow">
            {/* Catégorie principale */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4 flex-1">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedCategories[category.id] ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
                
                {/* Image */}
                {category.imageUrl ? (
                  <img 
                    src={category.imageUrl} 
                    alt={category.name} 
                    className="h-12 w-12 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Tag className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                
                <div className="flex items-center space-x-3 flex-1">
                  {category.color && (
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">{category.name}</div>
                    {category.description && (
                      <div className="text-sm text-gray-500">{category.description}</div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggleActive(category.id, category.isActive)}
                  className={`px-3 py-1 text-xs rounded-full font-semibold cursor-pointer transition-colors ${
                    category.isActive 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={category.isActive ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                >
                  <Power className="h-3 w-3 inline mr-1" />
                  {category.isActive ? 'Actif' : 'Inactif'}
                </button>
                
                {category.subCategories && category.subCategories.length > 0 && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {category.subCategories.length} sous-cat
                  </span>
                )}
                
                {category._count && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                    {category._count.products} produit{category._count.products > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleMoveOrder(category.id, 'up')}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                  disabled={index === 0}
                  title="Monter"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleMoveOrder(category.id, 'down')}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30"
                  disabled={index === filteredCategories.length - 1}
                  title="Descendre"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDuplicate(category)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-md"
                  title="Dupliquer"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleAddSubCategory(category)}
                  className="px-2 py-1.5 text-sm bg-green-50 text-green-700 hover:bg-green-100 rounded-md flex items-center space-x-1"
                  title="Ajouter une sous-catégorie"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                  title="Modifier"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Sous-catégories */}
            {expandedCategories[category.id] && category.subCategories && category.subCategories.length > 0 && (
              <div className="border-t bg-gray-50 p-4">
                <div className="space-y-2">
                  {category.subCategories.map((subCategory) => (
                    <div
                      key={subCategory.id}
                      className="flex items-center justify-between bg-white p-3 rounded-lg border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-1 h-8 bg-blue-400 rounded"></div>
                        
                        {/* Image sous-catégorie */}
                        {subCategory.imageUrl ? (
                          <img 
                            src={subCategory.imageUrl} 
                            alt={subCategory.name} 
                            className="h-8 w-8 object-cover rounded border border-gray-200"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-gray-50 rounded flex items-center justify-center">
                            <Tag className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{subCategory.name}</div>
                          {subCategory.description && (
                            <div className="text-xs text-gray-500">{subCategory.description}</div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleToggleSubActive(subCategory.id, subCategory.isActive)}
                          className={`px-2 py-0.5 text-xs rounded-full font-semibold cursor-pointer transition-colors ${
                            subCategory.isActive 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={subCategory.isActive ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                        >
                          <Power className="h-2.5 w-2.5 inline mr-1" />
                          {subCategory.isActive ? 'Actif' : 'Inactif'}
                        </button>
                        
                        {subCategory._count && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                            {subCategory._count.products} prod
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditSubCategory(category, subCategory)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubCategory(subCategory.id, subCategory)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message si aucune sous-catégorie */}
            {expandedCategories[category.id] && (!category.subCategories || category.subCategories.length === 0) && (
              <div className="border-t bg-gray-50 p-4 text-center text-gray-500 text-sm">
                Aucune sous-catégorie. Cliquez sur "+ Sous-catégorie" pour en ajouter.
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <div className="card text-center py-12 text-gray-500">
          <Tag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Aucune catégorie trouvée</p>
        </div>
      )}

      {/* Modal Création/Édition Catégorie */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="Ex: Fruits exotiques"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="3"
              placeholder="Description de la catégorie"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Icon (emoji ou nom)</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="input"
              placeholder="Ex: 🍎 ou fruit-icon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Couleur (hex)</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="input flex-1"
                placeholder="#FF5733"
              />
              <input
                type="color"
                value={formData.color || '#000000'}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20 rounded border"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📸 Image de la catégorie</label>
            {formData.imageUrl && !imageFile && (
              <div className="flex items-center space-x-3 mb-3">
                <img 
                  src={formData.imageUrl} 
                  alt="Image actuelle" 
                  className="h-16 w-16 object-cover rounded-lg border"
                />
                <span className="text-sm text-gray-600">Image actuelle</span>
              </div>
            )}
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
                  setImageFile(file)
                }
              }}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG (max 5MB)</p>
          </div>
          
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Catégorie active</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Annuler</span>
            </button>
            <button type="submit" className="btn-primary flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>{editingCategory ? 'Modifier' : 'Créer'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Création/Édition Sous-Catégorie */}
      <Modal 
        isOpen={subModalOpen} 
        onClose={() => setSubModalOpen(false)} 
        title={editingSubCategory ? 'Modifier la sous-catégorie' : `Nouvelle sous-catégorie - ${selectedCategory?.name}`}
      >
        <form onSubmit={handleSubCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom *</label>
            <input
              type="text"
              required
              value={subFormData.name}
              onChange={(e) => setSubFormData({ ...subFormData, name: e.target.value })}
              className="input"
              placeholder="Ex: Pommes rouges"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={subFormData.description}
              onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
              className="input"
              rows="3"
              placeholder="Description de la sous-catégorie"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Icon (emoji ou nom)</label>
            <input
              type="text"
              value={subFormData.icon}
              onChange={(e) => setSubFormData({ ...subFormData, icon: e.target.value })}
              className="input"
              placeholder="Ex: 🍎 ou icon-name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📸 Image de la sous-catégorie</label>
            {subFormData.imageUrl && !subImageFile && (
              <div className="flex items-center space-x-3 mb-3">
                <img 
                  src={subFormData.imageUrl} 
                  alt="Image actuelle" 
                  className="h-16 w-16 object-cover rounded-lg border"
                />
                <span className="text-sm text-gray-600">Image actuelle</span>
              </div>
            )}
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
                  setSubImageFile(file)
                }
              }}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG (max 5MB)</p>
          </div>
          
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={subFormData.isActive}
                onChange={(e) => setSubFormData({ ...subFormData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Sous-catégorie active</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setSubModalOpen(false)}
              className="btn-secondary flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Annuler</span>
            </button>
            <button type="submit" className="btn-primary flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>{editingSubCategory ? 'Modifier' : 'Créer'}</span>
            </button>
          </div>
        </form>
      </Modal>

      <Toast toast={toast} onClose={hideToast} />
    </div>
  )
}

export default Categories
