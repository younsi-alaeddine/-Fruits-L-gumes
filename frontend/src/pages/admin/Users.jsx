import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, Shield, Phone, AlertCircle, Key, History, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import Toast from '../../components/common/Toast'
import Modal from '../../components/common/Modal'
import { useToast } from '../../hooks/useToast'
import { 
  getUsers, createUser, updateUser, deleteUser, toggleUserStatus,
  resetUserPassword, getUserRoles, assignRole, removeRole, getUserActivity,
  approveUser, rejectUser
} from '../../api/users'
import { getClients } from '../../api/clients'
import { getStores } from '../../api/stores'
import { format } from 'date-fns'

/**
 * Page de gestion des utilisateurs - ADMIN
 * CRUD complet pour la gestion des utilisateurs
 */
function AdminUsers() {
  const { toast, hideToast, showSuccess, showError } = useToast()

  const [users, setUsers] = useState([])
  const [clients, setClients] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('') // 'pending', 'approved', 'all'
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, userId: null })
  const [selectedUser, setSelectedUser] = useState(null)
  const [rolesModal, setRolesModal] = useState({ isOpen: false, userId: null, roles: [], user: null })
  const [passwordModal, setPasswordModal] = useState({ isOpen: false, userId: null, user: null })
  const [activityModal, setActivityModal] = useState({ isOpen: false, userId: null, activities: [] })
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'CLIENT',
    clientId: '',
    storeId: '',
    isActive: true,
  })

  const roleOptions = ['ADMIN', 'CLIENT', 'MANAGER', 'PREPARATEUR', 'LIVREUR', 'COMMERCIAL', 'STOCK_MANAGER', 'FINANCE']

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadUsers(), loadClients(), loadStores()])
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const params = {
        page: 1,
        limit: 100,
        role: roleFilter || undefined,
      }
      const response = await getUsers(params)
      setUsers(response.users || [])
    } catch (error) {
      showError('Erreur lors du chargement des utilisateurs')
      console.error(error)
    }
  }

  const loadClients = async () => {
    try {
      const res = await getClients()
      setClients(res?.shops ?? [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadStores = async () => {
    try {
      const response = await getStores()
      setStores(response?.shops ?? [])
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (roleFilter !== undefined) {
      loadUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter])

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
        role: user.role || 'CLIENT',
        clientId: user.clientId || '',
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
        role: 'CLIENT',
        clientId: '',
        storeId: '',
        isActive: true,
      })
    }
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedUser(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || undefined,
      }
      delete payload.firstName
      delete payload.lastName
      if (selectedUser) {
        await updateUser(selectedUser.id, payload)
        showSuccess('Utilisateur modifié avec succès')
      } else {
        await createUser(payload)
        showSuccess('Utilisateur créé avec succès')
      }
      handleCloseModal()
      loadUsers()
    } catch (error) {
      showError(selectedUser ? 'Erreur lors de la modification' : 'Erreur lors de la création')
      console.error(error)
    }
  }

  const handleDelete = async (userId) => {
    try {
      await deleteUser(userId)
      showSuccess('Utilisateur supprimé avec succès')
      loadUsers()
    } catch (error) {
      showError('Erreur lors de la suppression')
      console.error(error)
    }
    setDeleteDialog({ isOpen: false, userId: null })
  }

  const handleToggleStatus = async (user) => {
    try {
      await toggleUserStatus(user.id, !user.isActive)
      showSuccess(`Utilisateur ${user.isActive !== false ? 'désactivé' : 'activé'} avec succès`)
      loadUsers()
    } catch (error) {
      showError('Erreur lors du changement de statut')
      console.error(error)
    }
  }

  const handleViewRoles = async (user) => {
    try {
      const data = await getUserRoles(user.id)
      setRolesModal({ isOpen: true, userId: user.id, roles: data.roles || [], user })
    } catch (error) {
      showError('Erreur lors du chargement des rôles')
    }
  }

  const handleAssignRole = async (role, scopeType, scopeId) => {
    try {
      await assignRole(rolesModal.userId, role, scopeType, scopeId)
      showSuccess('Rôle assigné avec succès')
      const data = await getUserRoles(rolesModal.userId)
      setRolesModal({ ...rolesModal, roles: data.roles || [] })
    } catch (error) {
      showError('Erreur lors de l\'assignation du rôle')
    }
  }

  const handleRemoveRole = async (roleAssignmentId) => {
    try {
      await removeRole(rolesModal.userId, roleAssignmentId)
      showSuccess('Rôle retiré avec succès')
      const data = await getUserRoles(rolesModal.userId)
      setRolesModal({ ...rolesModal, roles: data.roles || [] })
    } catch (error) {
      showError('Erreur lors de la suppression du rôle')
    }
  }

  const handleResetPassword = async () => {
    try {
      await resetUserPassword(passwordModal.userId, passwordModal.newPassword)
      showSuccess('Mot de passe réinitialisé avec succès')
      setPasswordModal({ isOpen: false, userId: null, newPassword: '' })
    } catch (error) {
      showError('Erreur lors de la réinitialisation')
    }
  }

  const handleViewActivity = async (user) => {
    try {
      const data = await getUserActivity(user.id)
      setActivityModal({ isOpen: true, userId: user.id, activity: data.activity || [], user })
    } catch (error) {
      showError('Erreur lors du chargement de l\'historique')
    }
  }

  const handleApproveUser = async (userId) => {
    try {
      await approveUser(userId)
      showSuccess('Utilisateur approuvé avec succès')
      loadUsers()
    } catch (error) {
      showError('Erreur lors de l\'approbation')
      console.error(error)
    }
  }

  const handleRejectUser = async (userId) => {
    try {
      await rejectUser(userId)
      showSuccess('Approbation retirée avec succès')
      loadUsers()
    } catch (error) {
      showError('Erreur lors du rejet')
      console.error(error)
    }
  }

  const filteredUsers = users.filter((user) => {
    // Filtre de recherche
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      const matchesSearch = 
        user.email?.toLowerCase().includes(search) ||
        user.name?.toLowerCase().includes(search) ||
        user.firstName?.toLowerCase().includes(search) ||
        user.lastName?.toLowerCase().includes(search)
      if (!matchesSearch) return false
    }

    // Filtre d'approbation
    if (approvalFilter === 'pending') {
      if (user.role !== 'CLIENT' || user.isApproved) return false
    } else if (approvalFilter === 'approved') {
      if (user.role !== 'CLIENT' || !user.isApproved) return false
    }

    return true
  })

  const canSelectClient = ['CLIENT'].includes(formData.role)
  const canSelectStore = ['MANAGER', 'PREPARATEUR', 'LIVREUR', 'COMMERCIAL', 'STOCK_MANAGER', 'FINANCE'].includes(formData.role)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Utilisateurs</h1>
          <p className="text-gray-600">Gestion des utilisateurs et permissions</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvel utilisateur</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
              }}
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
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="input pl-10"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente d'approbation</option>
              <option value="approved">Approuvés</option>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client / Magasin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vérification</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const client = clients.find((c) => c.id === user.clientId)
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
                          {client && <p>Client: {client.companyName}</p>}
                          {store && <p>Magasin: {store.name}</p>}
                          {!client && !store && <p className="text-gray-400">-</p>}
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
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-1">
                            {user.emailVerified ? (
                              <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                <CheckCircle className="h-3 w-3" />
                                <span>Email vérifié</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                <Clock className="h-3 w-3" />
                                <span>Email non vérifié</span>
                              </span>
                            )}
                          </div>
                          {user.role === 'CLIENT' && (
                            <div className="flex items-center space-x-1">
                              {user.isApproved ? (
                                <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Approuvé</span>
                                </span>
                              ) : (
                                <span className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                  <Clock className="h-3 w-3" />
                                  <span>En attente</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
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
                          {user.role === 'CLIENT' && !user.isApproved && (
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approuver l'utilisateur"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {user.role === 'CLIENT' && user.isApproved && (
                            <button
                              onClick={() => handleRejectUser(user.id)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Retirer l'approbation"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleViewRoles(user)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Gérer les rôles"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setPasswordModal({ isOpen: true, userId: user.id, newPassword: '' })}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Réinitialiser mot de passe"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleViewActivity(user)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Historique"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.isActive !== false 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={user.isActive !== false ? 'Désactiver' : 'Activer'}
                          >
                            <Eye className="h-4 w-4" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rôle *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        role: e.target.value,
                        clientId: '',
                        storeId: '',
                      })
                    }}
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
                {canSelectClient && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Client</label>
                    <select
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      className="input"
                    >
                      <option value="">Sélectionner un client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {canSelectStore && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Magasin</label>
                    <select
                      value={formData.storeId}
                      onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                      className="input"
                    >
                      <option value="">Sélectionner un magasin</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {selectedUser && (
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Actif</span>
                  </label>
                </div>
              )}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedUser ? 'Modifier' : 'Créer'}
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
              <h3 className="text-xl font-bold text-gray-900">Supprimer l'utilisateur</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteDialog({ isOpen: false, userId: null })}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteDialog.userId)}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestion des Rôles */}
      {rolesModal.isOpen && (
        <Modal 
          isOpen={rolesModal.isOpen} 
          onClose={() => setRolesModal({ isOpen: false, userId: null, roles: [] })}
          title={`Gestion des rôles - ${rolesModal.user?.email || ''}`}
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Rôles assignés</h3>
              <div className="space-y-2">
                {rolesModal.roles.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucun rôle assigné</p>
                ) : (
                  rolesModal.roles.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-semibold">{assignment.role}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({assignment.scopeType === 'ORG' ? 'Organisation' : 'Magasin'})
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveRole(assignment.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                      >
                        Retirer
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Assigner un nouveau rôle</h3>
              <form onSubmit={(e) => {
                e.preventDefault()
                const form = e.target
                handleAssignRole(form.role.value, form.scopeType.value, form.scopeId.value || null)
                form.reset()
              }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select name="role" className="input" required>
                    <option value="">Sélectionner un rôle</option>
                    {roleOptions.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <select name="scopeType" className="input" required>
                    <option value="ORG">Organisation</option>
                    <option value="SHOP">Magasin</option>
                  </select>
                </div>
                <button type="submit" className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Assigner
                </button>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Réinitialisation mot de passe */}
      {passwordModal.isOpen && (
        <Modal
          isOpen={passwordModal.isOpen}
          onClose={() => setPasswordModal({ isOpen: false, userId: null, newPassword: '' })}
          title="Réinitialiser le mot de passe"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau mot de passe *</label>
              <input
                type="password"
                value={passwordModal.newPassword}
                onChange={(e) => setPasswordModal({ ...passwordModal, newPassword: e.target.value })}
                className="input w-full"
                placeholder="Minimum 8 caractères"
                required
                minLength={8}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPasswordModal({ isOpen: false, userId: null, newPassword: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleResetPassword}
                disabled={passwordModal.newPassword.length < 8}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Historique */}
      {activityModal.isOpen && (
        <Modal
          isOpen={activityModal.isOpen}
          onClose={() => setActivityModal({ isOpen: false, userId: null, activity: [] })}
          title={`Historique - ${activityModal.user?.email || ''}`}
        >
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activityModal.activity.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucune activité enregistrée</p>
            ) : (
              activityModal.activity.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{item.action}</p>
                      <p className="text-xs text-gray-600">{item.entity}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  )
}

export default AdminUsers
