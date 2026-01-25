import React, { useState, useEffect } from 'react'
import { Users, Search, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getClients, createClient, updateClient, deleteClient } from '../../api/clients'
import { format } from 'date-fns'

/**
 * Page de gestion des clients - ADMIN
 * CRUD complet pour la gestion des clients
 */
function AdminClients() {
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, clientId: null })
  const [selectedClient, setSelectedClient] = useState(null)
  const [formData, setFormData] = useState({
    companyName: '',
    siret: '',
    address: { street: '', city: '', zipCode: '', country: 'France' },
    contactEmail: '',
    contactPhone: '',
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const response = await getClients({ page: 1, limit: 100 })
      setClients(response.data || [])
    } catch (error) {
      showError('Erreur lors du chargement des clients')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (client = null) => {
    if (client) {
      setSelectedClient(client)
      setFormData({
        companyName: client.companyName || '',
        siret: client.siret || '',
        address: {
          street: client.address?.street || '',
          city: client.address?.city || '',
          zipCode: client.address?.zipCode || '',
          country: client.address?.country || 'France',
        },
        contactEmail: client.contactEmail || '',
        contactPhone: client.contactPhone || '',
      })
    } else {
      setSelectedClient(null)
      setFormData({
        companyName: '',
        siret: '',
        address: { street: '', city: '', zipCode: '', country: 'France' },
        contactEmail: '',
        contactPhone: '',
      })
    }
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedClient(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedClient) {
        await updateClient(selectedClient.id, formData)
        showSuccess('Client modifié avec succès')
      } else {
        await createClient(formData)
        showSuccess('Client créé avec succès')
      }
      handleCloseModal()
      loadClients()
    } catch (error) {
      showError(selectedClient ? 'Erreur lors de la modification' : 'Erreur lors de la création')
      console.error(error)
    }
  }

  const handleDelete = async (clientId) => {
    try {
      await deleteClient(clientId)
      showSuccess('Client supprimé avec succès')
      loadClients()
    } catch (error) {
      showError('Erreur lors de la suppression')
      console.error(error)
    }
    setDeleteDialog({ isOpen: false, clientId: null })
  }

  const filteredClients = clients.filter((client) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      client.companyName?.toLowerCase().includes(search) ||
      client.siret?.includes(search) ||
      client.contactEmail?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Clients</h1>
          <p className="text-gray-600">Gestion des clients et propriétaires de magasins</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau client</span>
        </button>
      </div>

      {/* Recherche */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client (nom, SIRET, email)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Liste des clients */}
      {loading ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">Aucun client trouvé</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raison sociale</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-gray-900">{client.companyName}</p>
                        <p className="text-xs text-gray-500">SIRET: {client.siret}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {client.address?.street && <p>{client.address.street}</p>}
                        {client.address?.city && client.address?.zipCode && (
                          <p>{client.address.zipCode} {client.address.city}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <p>{client.contactEmail}</p>
                        {client.contactPhone && <p>{client.contactPhone}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          client.isActive !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {client.isActive !== false ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(client)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ isOpen: true, clientId: client.id })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              {selectedClient ? 'Modifier le client' : 'Nouveau client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Raison sociale *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    SIRET *
                  </label>
                  <input
                    type="text"
                    value={formData.siret}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    className="input"
                    required
                  />
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedClient ? 'Modifier' : 'Créer'}
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
              <h3 className="text-xl font-bold text-gray-900">Supprimer le client</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible et supprimera tous les magasins associés.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteDialog({ isOpen: false, clientId: null })}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteDialog.clientId)}
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

export default AdminClients
