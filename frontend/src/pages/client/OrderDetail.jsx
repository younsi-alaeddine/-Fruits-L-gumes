import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Calendar, MapPin, DollarSign } from 'lucide-react'
import { getOrder } from '../../api/orders'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import { format } from 'date-fns'
import { ROUTES } from '../../constants/routes'

/**
 * Détail d'une commande - CLIENT
 */
function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast, showToast, hideToast, showError } = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadOrder()
  }, [id])

  const loadOrder = async () => {
    try {
      setLoading(true)
      const res = await getOrder(id)
      setOrder(res?.order ?? null)
    } catch (e) {
      showError('Commande introuvable')
      navigate(ROUTES.CLIENT.ORDERS)
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

  if (!order) return null

  const items = order.items || []
  const shop = order.shop || {}

  return (
    <div className="space-y-6">
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(ROUTES.CLIENT.ORDERS)}
          className="btn btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux commandes
        </button>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="card">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          Commande {order.orderNumber || order.id?.slice(0, 8)}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Créée le {format(new Date(order.createdAt), 'dd MMM yyyy HH:mm')}</span>
          </div>
          {order.deliveryDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Livraison prévue {format(new Date(order.deliveryDate), 'dd MMM yyyy')}</span>
            </div>
          )}
          {shop.name && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{shop.name}</span>
              {shop.address && <span className="text-gray-500"> – {shop.address}, {shop.city}</span>}
            </div>
          )}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="font-semibold text-gray-900">
              Total TTC : {order.totalTTC?.toFixed(2) ?? order.total?.toFixed(2) ?? '0.00'} €
            </span>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Articles
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-700">Produit</th>
                <th className="text-right py-2 font-medium text-gray-700">Quantité</th>
                <th className="text-right py-2 font-medium text-gray-700">Unité</th>
                <th className="text-right py-2 font-medium text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2">{item.product?.name ?? 'Produit'}</td>
                  <td className="text-right py-2">{item.quantity ?? item.orderedQuantity ?? 0}</td>
                  <td className="text-right py-2">{item.product?.unit ?? 'u'}</td>
                  <td className="text-right py-2">
                    {((item.quantity ?? item.orderedQuantity ?? 0) * (item.unitPrice ?? item.price ?? 0)).toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail
