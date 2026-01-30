import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, Mail, Package, ShoppingCart } from 'lucide-react'
import { getClientShop } from '../../api/stores'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import { ROUTES } from '../../constants/routes'

/** Détail d'un magasin - CLIENT (utilise GET /client/shops/:id si disponible, sinon fallback) */
function StoreDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast, showToast, hideToast, showError } = useToast()
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadStore()
  }, [id])

  const loadStore = async () => {
    try {
      setLoading(true)
      const res = await getClientShop(id)
      setStore(res?.shop ?? res ?? null)
    } catch (e) {
      showError('Magasin introuvable')
      navigate(ROUTES.CLIENT.STORES)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600" />
      </div>
    )
  }
  if (!store) return null

  const address = [store.address, store.postalCode, store.city].filter(Boolean).join(', ')

  return (
    <div className="space-y-6">
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(ROUTES.CLIENT.STORES)}
          className="btn btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux magasins
        </button>
      </div>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{store.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600">{address}</span>
            </div>
          )}
          {(store.phone || store.contactPhone) && (
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-gray-400" />
              <span>{store.phone || store.contactPhone}</span>
            </div>
          )}
          {(store.contactEmail || store.contactPerson) && (
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-400" />
              <span>{store.contactEmail || store.contactPerson}</span>
            </div>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`${ROUTES.CLIENT.ORDERS}?store=${store.id}`)}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Voir les commandes
          </button>
          <button
            onClick={() => navigate(ROUTES.CLIENT.ORDER_CREATE)}
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Nouvelle commande
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoreDetail
