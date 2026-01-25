import React, { useState, useEffect } from 'react'
import { Store, Search, Plus, Edit2, Trash2, MapPin, Phone, Mail, AlertCircle } from 'lucide-react'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getStores, createStore, updateStore, deleteStore } from '../../api/stores'
import { getClients } from '../../api/clients'
import { getUsers } from '../../api/users'

/**
 * Page de gestion des magasins - ADMIN
 * CRUD complet pour la gestion des magasins
 */
function AdminStores() {
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [stores, setStores] = useState([])
  const [clients, setClients] = useState([])
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, storeId: null })
  const [selectedStore, setSelectedStore] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: { street: '', city: '', zipCode: '', country: 'France' },
    phone: '',
    email: '',
    clientId: '',
    managerId: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadStores(), loadClients(), loadManagers()])
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStores = async () => {
    try {
      const response = await getStores({ page: 1, limit: 100 })
      setStores(response.shops || [])
    } catch (error) {
      showError('Erreur lors du chargement des magasins')
      console.error(error)
    }
  }

  const loadClients = async () => {
    try {
      const response = await getClients()
      setClients(response.clients || response.users || [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadManagers = async () => {
    try {
      const response = await getUsers({ role: 'MANAGER' })
      setManagers(response?.users ?? [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleOpenModal = (store = null) => {
    if (store) {
      setSelectedStore(store)
      setFormData({
        name: store.name || '',
        code: store.code || '',
        address: {
          street: store.address?.street || '',
          city: store.address?.city || '',
          zipCode: store.address?.zipCode || '',
          country: store.address?.country || 'France',
        },
        phone: store.phone || '',
        email: store.email || '',
        clientId: store.clientId || '',
        managerId: store.managerId || '',
      })
    } else {
      setSelectedStore(null)
      setFormData({
        name: '',
        code: '',
        address: { street: '', city: '', zipCode: '', country: 'France' },
        phone: '',
        email: '',
        clientId: '',
        managerId: '',
      })
    }
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedStore(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedStore) {
        await updateStore(selectedStore.id, formData)
        showSuccess('Magasin modifié avec succès')
      } else {
        await createStore(formData)
        showSuccess('Magasin créé avec succès')
      }
      handleCloseModal()
      loadStores()
    } catch (error) {
      showError(selectedStore ? 'Erreur lors de la modification' : 'Erreur lors de la création')
      console.error(error)
    }
  }

  const handleDelete = async (storeId) => {
    try {
      await deleteStore(storeId)
      showSuccess('Magasin supprimé avec succès')
      loadStores()
    } catch (error) {
      showError('Erreur lors de la suppression')
      console.error(error)
    }
    setDeleteDialog({ isOpen: false, storeId: null })
  }

  const filteredStores = stores.filter((store) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      store.name?.toLowerCase().includes(search) ||
      store.code?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Magasins</h1>
          <p className="text-gray-600">Gestion des magasins et entrepôts</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau magasin</span>
        </button>
      </div>

      {/* Recherche */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un magasin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Liste des magasins */}
      {loading ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Aucun magasin trouvé</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStores.map((store) => {
                  const client = clients.find((c) => c.id === store.clientId)
                  const manager = managers.find((m) => m.id === store.managerId)
                  return (
                    <tr key={store.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900">{store.name}</p>
                          <p className="text-xs text-gray-500">Code: {store.code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <p>{client?.companyName || 'Non assigné'}</p>
                          {manager && (
                            <p className="text-xs text-gray-500">Manager: {manager.firstName} {manager.lastName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {store.address?.street && (
                            <p className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{store.address.street}</span>
                            </p>
                          )}
                          {store.address?.city && store.address?.zipCode && (
                            <p>{store.address.zipCode} {store.address.city}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {store.phone && (
                            <p className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{store.phone}</span>
                            </p>
                          )}
                          {store.email && (
                            <p className="flex items-center space-x-1">
                              <Mail className="h-3 w-3" />
                              <span>{store.email}</span>
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenModal(store)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ isOpen: true, storeId: store.id })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal création/édition */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedStore ? 'Modifier le magasin' : 'Nouveau magasin'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du magasin *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input"
                    placeholder="ex: PARIS-NORD-001"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Client *</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Manager</label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="input"
                  >
                    <option value="">Non assigné</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.firstName} {manager.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
                <input
                  type="text"
                  placeholder="Rue"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                  className="input mb-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Code postal"
                    value={formData.address.zipCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, zipCode: e.target.value },
                      })
                    }
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Ville"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedStore ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog de suppression */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Supprimer le magasin</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce magasin ? Cette action est irréversible.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteDialog({ isOpen: false, storeId: null })}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteDialog.storeId)}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  )
}

export default AdminStores
