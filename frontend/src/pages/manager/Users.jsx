import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Shield, AlertCircle } from 'lucide-react'
import { getManagerUsers } from '../../api/users'
import { getManagerShops } from '../../api/stores'

function ManagerUsers() {
  const [users, setUsers] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStore, setSelectedStore] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [usersRes, storesRes] = await Promise.all([
        getManagerUsers({ page: 1, limit: 200 }).catch(() => ({ users: [] })),
        getManagerShops({ page: 1, limit: 200 }).catch(() => ({ shops: [] })),
      ])
      setUsers(usersRes?.users ?? [])
      setStores(storesRes?.shops ?? [])
    } catch (e) {
      setError('Impossible de charger les données.')
      setUsers([])
      setStores([])
    } finally {
      setLoading(false)
    }
  }

  const storeOptions = [
    { id: 'all', name: 'Tous les magasins' },
    ...(stores || []).map((s) => ({ id: s.id, name: s.name })),
  ]
  const filteredUsers =
    selectedStore === 'all'
      ? users
      : users.filter((u) => u.storeId === selectedStore)

  const getRoleBadge = (role) => {
    const styles = {
      PREPARATEUR: 'bg-blue-100 text-blue-700',
      LIVREUR: 'bg-green-100 text-green-700',
      STOCK_MANAGER: 'bg-purple-100 text-purple-700',
      COMMERCIAL: 'bg-orange-100 text-orange-700',
      MANAGER: 'bg-indigo-100 text-indigo-700',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[role] || 'bg-gray-100 text-gray-700'}`}>
        {role}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Gestion des Équipes
        </h1>
        <button className="btn btn-primary flex items-center gap-2" disabled title="Réservé à l'administrateur">
          <Plus className="h-5 w-5" />
          <span>Ajouter employé</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="card">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par magasin</label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="input w-full max-w-md"
          >
            {storeOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Magasin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {user.store ?? stores.find((s) => s.id === user.storeId)?.name ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.isApproved !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.isApproved !== false ? 'Actif' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier (réservé admin)">
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title="Rôles (réservé admin)">
                          <Shield className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer (réservé admin)">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ManagerUsers
