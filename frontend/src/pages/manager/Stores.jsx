import React, { useState, useEffect } from 'react'
import { Store, Search, MapPin, Phone, Mail } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import DataTable from '../../components/common/DataTable'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getManagerShops } from '../../api/stores'

/**
 * Page Magasins MANAGER - Liste de SES magasins uniquement
 * Ne voit PAS les magasins des autres managers
 */
function ManagerStores() {
  const { user } = useAuth()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadStores()
  }, [user])

  const loadStores = async () => {
    try {
      setLoading(true)
      const response = await getManagerShops({ page: 1, limit: 200 })
      setStores(response?.shops ?? [])
    } catch (error) {
      showError('Erreur lors du chargement des magasins')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStores = stores.filter((store) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      store.name?.toLowerCase().includes(search) ||
      store.city?.toLowerCase().includes(search) ||
      (store.address && String(store.address).toLowerCase().includes(search))
    )
  })

  const columns = [
    {
      key: 'name',
      label: 'Magasin',
      render: (value) => (
        <div>
          <p className="font-semibold text-gray-900">{value}</p>
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Adresse',
      render: (value, store) => (
        <div className="flex items-start space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            {[value, store?.postalCode, store?.city].filter(Boolean).join(', ') || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (value, store) => (
        <div className="text-sm text-gray-600 space-y-1">
          {(value || store?.contactPhone) && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>{value || store?.contactPhone}</span>
            </div>
          )}
          {(store?.contactEmail || store?.contactPerson) && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>{store?.contactEmail || store?.contactPerson}</span>
            </div>
          )}
          {!value && !store?.contactPhone && !store?.contactEmail && !store?.contactPerson && '—'}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Magasins</h1>
          <p className="text-gray-600">Liste de vos {stores.length} magasin(s)</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un magasin (nom, ville)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Tableau */}
      <DataTable
        data={filteredStores}
        columns={columns}
        currentPage={1}
        totalPages={1}
        total={filteredStores.length}
        onPageChange={() => {}}
        loading={loading}
        emptyMessage="Aucun magasin trouvé"
      />

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  )
}

export default ManagerStores
