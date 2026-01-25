import React, { useState, useEffect } from 'react'
import {
  Gift, Plus, Edit2, Trash2, Search, Tag, Calendar, Percent,
  CheckCircle, XCircle, Copy
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import Modal from '../../components/common/Modal'
import {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion
} from '../../api/promotions'

function PromotionsManagement() {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast()
  
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState('all')
  
  // Modals
  const [addEditModal, setAddEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  
  // Données sélectionnées
  const [selectedPromo, setSelectedPromo] = useState(null)
  
  // Formulaire
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'PERCENTAGE',
    value: 0,
    minAmount: 0,
    maxDiscount: 0,
    validFrom: '',
    validTo: '',
    usageLimit: 0,
    isActive: true
  })

  useEffect(() => {
    loadPromotions()
  }, [filterActive])

  const loadPromotions = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterActive !== 'all') {
        params.isActive = filterActive === 'active'
      }
      
      const data = await getPromotions(params)
      setPromotions(data.promotions || [])
    } catch (error) {
      showError('Erreur lors du chargement des promotions')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedPromo) {
        await updatePromotion(selectedPromo.id, formData)
        showSuccess('Promotion modifiée avec succès')
      } else {
        await createPromotion({
          ...formData,
          code: formData.code.toUpperCase()
        })
        showSuccess('Promotion créée avec succès')
      }
      
      setAddEditModal(false)
      resetForm()
      loadPromotions()
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de l\'enregistrement')
    }
  }

  const handleDelete = async () => {
    try {
      await deletePromotion(selectedPromo.id)
      showSuccess('Promotion supprimée')
      setDeleteModal(false)
      setSelectedPromo(null)
      loadPromotions()
    } catch (error) {
      showError('Erreur lors de la suppression')
    }
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
    showSuccess('Code copié !')
  }

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      type: 'PERCENTAGE',
      value: 0,
      minAmount: 0,
      maxDiscount: 0,
      validFrom: '',
      validTo: '',
      usageLimit: 0,
      isActive: true
    })
    setSelectedPromo(null)
  }

  const isPromotionActive = (promo) => {
    if (!promo.isActive) return false
    const now = new Date()
    return new Date(promo.validFrom) <= now && new Date(promo.validTo) >= now
  }

  const filteredPromotions = (promotions || []).filter(p =>
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && promotions.length === 0) {
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
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-900 to-pink-600 bg-clip-text text-transparent">
            Promotions & Codes Promo
          </h1>
          <p className="text-gray-600 mt-2">Gérez vos campagnes promotionnelles</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setAddEditModal(true)
          }}
          className="btn-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-xl p-6">
          <Gift className="h-10 w-10 text-pink-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Total promotions</p>
          <p className="text-3xl font-bold text-gray-900">{promotions.length}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
          <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Actives</p>
          <p className="text-3xl font-bold text-gray-900">
            {promotions.filter(p => isPromotionActive(p)).length}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-6">
          <XCircle className="h-10 w-10 text-gray-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Expirées</p>
          <p className="text-3xl font-bold text-gray-900">
            {promotions.filter(p => new Date(p.validTo) < new Date()).length}
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
          <Tag className="h-10 w-10 text-blue-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Utilisations</p>
          <p className="text-3xl font-bold text-gray-900">
            {promotions.reduce((sum, p) => sum + (p.usageCount || 0), 0)}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher un code ou description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
          </select>
        </div>
      </div>

      {/* Liste des promotions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromotions.map((promo) => {
          const active = isPromotionActive(promo)
          const expired = new Date(promo.validTo) < new Date()
          
          return (
            <div
              key={promo.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
                active ? 'border-green-200' : expired ? 'border-gray-200' : 'border-yellow-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="px-3 py-1 bg-pink-100 text-pink-700 rounded-lg font-mono font-bold text-lg">
                      {promo.code}
                    </code>
                    <button
                      onClick={() => handleCopyCode(promo.code)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Copier"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  {active ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Active
                    </span>
                  ) : expired ? (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                      Expirée
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      À venir
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPromo(promo)
                      setFormData({
                        code: promo.code,
                        description: promo.description || '',
                        type: promo.type,
                        value: promo.value,
                        minAmount: promo.minAmount || 0,
                        maxDiscount: promo.maxDiscount || 0,
                        validFrom: promo.validFrom ? new Date(promo.validFrom).toISOString().split('T')[0] : '',
                        validTo: promo.validTo ? new Date(promo.validTo).toISOString().split('T')[0] : '',
                        usageLimit: promo.usageLimit || 0,
                        isActive: promo.isActive
                      })
                      setAddEditModal(true)
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPromo(promo)
                      setDeleteModal(true)
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {promo.description || 'Aucune description'}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Percent className="h-4 w-4 text-pink-500" />
                  <span className="font-semibold">
                    {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `${promo.value}€`}
                  </span>
                  <span className="text-gray-500">de réduction</span>
                </div>
                
                {promo.minAmount > 0 && (
                  <div className="text-gray-600">
                    <span className="text-gray-500">Minimum:</span> {promo.minAmount}€
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {new Date(promo.validFrom).toLocaleDateString('fr-FR')} → {new Date(promo.validTo).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                {promo.usageLimit > 0 && (
                  <div className="text-gray-600">
                    <span className="text-gray-500">Utilisations:</span> {promo.usageCount || 0} / {promo.usageLimit}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredPromotions.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Aucune promotion trouvée</p>
        </div>
      )}

      {/* Modal Add/Edit */}
      {addEditModal && (
        <Modal
          isOpen={addEditModal}
          onClose={() => {
            setAddEditModal(false)
            resetForm()
          }}
          title={selectedPromo ? 'Modifier la promotion' : 'Nouvelle promotion'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code promo *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="EX: PROMO2024"
                required
                disabled={!!selectedPromo}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Description de la promotion..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="PERCENTAGE">Pourcentage (%)</option>
                  <option value="FIXED">Montant fixe (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valeur * ({formData.type === 'PERCENTAGE' ? '%' : '€'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant minimum (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Réduction max (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valide du *</label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valide jusqu'au *</label>
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite d'utilisation (0 = illimité)
              </label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Promotion active
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setAddEditModal(false)
                  resetForm()
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedPromo ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Delete */}
      {deleteModal && selectedPromo && (
        <Modal
          isOpen={deleteModal}
          onClose={() => {
            setDeleteModal(false)
            setSelectedPromo(null)
          }}
          title="Supprimer la promotion"
        >
          <div className="space-y-4">
            <p>Êtes-vous sûr de vouloir supprimer la promotion <strong>{selectedPromo.code}</strong> ?</p>
            <p className="text-sm text-red-600">Cette action est irréversible.</p>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setDeleteModal(false)
                  setSelectedPromo(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default PromotionsManagement
