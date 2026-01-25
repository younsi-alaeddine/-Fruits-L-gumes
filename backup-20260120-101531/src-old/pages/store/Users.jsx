import React, { useState, useEffect } from 'react'
import { Users, Search, Plus, Edit2, Trash2, Shield, Phone, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/users'

/**
 * Page de gestion de l'équipe - MAGASIN
 * Gestion des utilisateurs du magasin
 */
function StoreUsers() {
  const { user: currentUser } = useAuth()
  const { activeStore } = useStore()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, userId: null })
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'PREPARATEUR',
    isActive: true,
  })

  // Rôles disponibles pour le magasin (sauf ADMIN et CLIENT)
  const roleOptions = ['MANAGER', 'PREPARATEUR', 'LIVREUR', 'COMMERCIAL', 'STOCK_MANAGER']

  useEffect(() => {
    if (activeStore?.id) {
      loadUsers()
    }
  }, [activeStore])

  const loadUsers = async () => {
    if (!activeStore?.id) {
      setUsers([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await getUsers({})
      // Filtrer les utilisateurs du magasin actif
      const storeUsers = (response.data || []).filter((u) => u.storeId === activeStore.id)
      setUsers(storeUsers)
    } catch (error) {
      showError('Erreur lors du chargement des utilisateurs')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (roleFilter !== undefined) {
      loadUsers()
    }
  }, [roleFilter])

  const handleOpenModal = (user = null) => {
    if (user) {
      setSelectedUser(user)
      setFormData({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        role: user.role || 'PREPARATEUR',
        isActive: user.isActive !== undefined ? user.isActive : true,
      })
    } else {
      setSelectedUser(null)
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'PREPARATEUR',
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
      role: 'PREPARATEUR',
      isActive: true,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!activeStore?.id) {
      showError('Aucun magasin sélectionné')
      return
    }

    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, {
          ...formData,
          storeId: activeStore.id,
        })
        showSuccess('Membre d\'équipe mis à jour avec succès')
      } else {
        await createUser({
          ...formData,
          storeId: activeStore.id,
          clientId: activeStore.clientId,
        })
        showSuccess('Membre d\'équipe ajouté avec succès')
      }
      handleCloseModal()
      loadUsers()
    } catch (error) {
      showError('Erreur lors de la sauvegarde')
      console.error(error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteUser(deleteDialog.userId)
      showSuccess('Membre d\'équipe supprimé avec succès')
      setDeleteDialog({ isOpen: false, userId: null })
      loadUsers()
    } catch (error) {
      showError('Erreur lors de la suppression')
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
    return matchesSearch && matchesRole
  })

  if (!activeStore) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Veuillez sélectionner un magasin</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Équipe</h1>
          <p className="text-gray-600">Gestion de l'équipe du magasin {activeStore.name}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un membre</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
              placeholder="Rechercher un membre..."
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
        </div>
      </div>

      {/* Liste des utilisateurs */}
      {loading ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun membre d'équipe trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                  user.isActive !== false
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {user.isActive !== false ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-semibold">
                    {user.role}
                  </span>
                </div>
                {user.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleOpenModal(user)}
                  className="flex-1 btn btn-secondary text-sm py-2"
                >
                  <Edit2 className="h-4 w-4 inline mr-2" />
                  Modifier
                </button>
                <button
                  onClick={() => setDeleteDialog({ isOpen: true, userId: user.id })}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création/édition */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedUser ? 'Modifier le membre' : 'Ajouter un membre'}
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
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                  Membre actif
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
                  {selectedUser ? 'Enregistrer' : 'Ajouter'}
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
              Êtes-vous sûr de vouloir retirer ce membre de l'équipe ? Cette action est irréversible.
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

export default StoreUsers
