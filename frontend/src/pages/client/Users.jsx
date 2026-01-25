import React, { useState, useEffect } from 'react'
import { User, Search, Plus, Edit2, Trash2, Shield, Mail, Phone, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users'
import { format } from 'date-fns'

/**
 * Page de gestion des utilisateurs - CLIENT
 * Gestion des utilisateurs des magasins du client
 */
function ClientUsers() {
  const { user: currentUser } = useAuth()
  const { stores } = useStore()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, userId: null })
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'MANAGER',
    storeId: '',
    isActive: true,
  })

  // Rôles disponibles pour les magasins du client
  const roleOptions = ['MANAGER', 'PREPARATEUR', 'LIVREUR', 'COMMERCIAL', 'STOCK_MANAGER', 'CLIENT']

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadUsers()])
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await getUsers({})
      let list = res?.users ?? []
      const storeIds = stores.map((s) => s.id)
      if (storeIds.length) {
        list = list.filter((u) => u.storeId && storeIds.includes(u.storeId))
      }
      setUsers(list)
    } catch (error) {
      showError('Erreur lors du chargement des utilisateurs')
      console.error(error)
    }
  }

  useEffect(() => {
    if (roleFilter !== undefined || storeFilter !== undefined) {
      loadUsers()
    }
  }, [roleFilter, storeFilter])

  const parseName = (name) => {
    if (!name || typeof name !== 'string') return { firstName: '', lastName: '' }
    const parts = name.trim().split(/\s+/)
    if (parts.length === 0) return { firstName: '', lastName: '' }
    if (parts.length === 1) return { firstName: parts[0], lastName: '' }
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
  }

  const handleOpenModal = (user = null) => {
    if (user) {
      setSelectedUser(user)
      const { firstName, lastName } = parseName(user.name)
      setFormData({
        email: user.email || '',
        firstName,
        lastName,
        phone: user.phone || '',
        role: user.role || 'MANAGER',
        storeId: user.storeId || '',
        isActive: user.isActive !== undefined ? user.isActive : true,
      })
    } else {
      setSelectedUser(null)
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'MANAGER',
        storeId: stores[0]?.id || '',
        isActive: true,
      })
    }
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedUser(null)
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'MANAGER',
      storeId: '',
      isActive: true,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || undefined,
        clientId: currentUser?.clientId,
      }
      delete payload.firstName
      delete payload.lastName
      if (selectedUser) {
        await updateUser(selectedUser.id, payload)
        showSuccess('Utilisateur mis à jour avec succès')
      } else {
        await createUser(payload)
        showSuccess('Utilisateur créé avec succès')
      }
      handleCloseModal()
      loadUsers()
    } catch (error) {
      showError('Erreur lors de la sauvegarde de l\'utilisateur')
      console.error(error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteUser(deleteDialog.userId)
      showSuccess('Utilisateur supprimé avec succès')
      setDeleteDialog({ isOpen: false, userId: null })
      loadUsers()
    } catch (error) {
      showError('Erreur lors de la suppression de l\'utilisateur')
      console.error(error)
    }
  }

  // Filtrer les utilisateurs selon les critères
  const filteredUsers = users.filter((u) => {
    const matchesSearch = !searchQuery || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = !roleFilter || u.role === roleFilter
    const matchesStore = !storeFilter || u.storeId === storeFilter
    return matchesSearch && matchesRole && matchesStore
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Utilisateurs</h1>
          <p className="text-gray-600">Gestion des utilisateurs de vos magasins</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau utilisateur</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
              placeholder="Rechercher un utilisateur..."
            />
          </div>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input pl-10"
            >
              <option value="">Tous les rôles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
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

      {/* Liste des utilisateurs */}
      {loading ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Magasin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const store = stores.find((s) => s.id === user.storeId)
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            {user.name || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-gray-400" />
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg">
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {store ? store.name : <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.phone && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.isActive !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.isActive !== false ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ isOpen: true, userId: user.id })}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                  disabled={!!selectedUser}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rôle *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input"
                    required
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Magasin</label>
                  <select
                    value={formData.storeId}
                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                    className="input"
                  >
                    <option value="">Aucun magasin</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                  Utilisateur actif
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedUser ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteDialog({ isOpen: false, userId: null })}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
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

export default ClientUsers
