import React, { useState, useEffect } from 'react'
import { Package, AlertCircle, CheckCircle2, AlertTriangle, Minus, Plus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import { usePermission } from '../../hooks/usePermission'
import { RESOURCES, ACTIONS } from '../../constants/permissions'
import ProtectedRoute from '../../components/common/ProtectedRoute'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getOrdersToPrepare, getOrdersInPreparation, prepareOrder, markOrderReady } from '../../api/orders'
import { getStock } from '../../api/stocks'
import { format } from 'date-fns'

/**
 * Page de préparation des commandes - MAGASIN
 * 
 * Logique métier :
 * - Affiche les commandes confirmées ou en préparation
 * - Permet de préparer une commande en ajustant les quantités réelles
 * - Gère les écarts entre commandé et préparé
 * - Décrémente le stock uniquement lors de la préparation
 */
function Preparation() {
  const { user } = useAuth()
  const { activeStore } = useStore()
  const { canPrepare, canMarkReady } = usePermission(RESOURCES.ORDERS)
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [preparationModalOpen, setPreparationModalOpen] = useState(false)
  const [preparationItems, setPreparationItems] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, orderId: null })

  useEffect(() => {
    if (activeStore?.id) {
      loadOrders()
    }
  }, [activeStore])

  const loadOrders = async () => {
    try {
      setLoading(true)
      // Récupérer les commandes à préparer et en préparation
      const [toPrepare, inPreparation] = await Promise.all([
        getOrdersToPrepare(activeStore.id),
        getOrdersInPreparation(activeStore.id),
      ])

      // Combiner les deux listes
      const allOrders = [
        ...(toPrepare.data || []),
        ...(inPreparation.data || []),
      ]

      // Trier par priorité (confirmée avant en préparation)
      allOrders.sort((a, b) => {
        if (a.status === 'confirmée' && b.status === 'en_préparation') return -1
        if (a.status === 'en_préparation' && b.status === 'confirmée') return 1
        return new Date(b.createdAt) - new Date(a.createdAt)
      })

      setOrders(allOrders)
    } catch (error) {
      showError('Erreur lors du chargement des commandes')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartPreparation = (order) => {
    // Initialiser les quantités préparées avec les quantités commandées
    const items = order.items.map((item) => ({
      ...item,
      preparedQuantity: item.orderedQuantity || item.quantity,
      gap: 0,
      gapReason: '',
      availableStock: 0, // Sera chargé
    }))

    // Charger les stocks disponibles pour chaque produit
    Promise.all(
      items.map(async (item) => {
        try {
          const stockData = await getStock(activeStore.id, item.productId)
          return {
            ...item,
            availableStock: stockData.data?.availableQuantity || 0,
          }
        } catch (error) {
          return { ...item, availableStock: 0 }
        }
      })
    ).then((itemsWithStock) => {
      setPreparationItems(itemsWithStock)
      setSelectedOrder(order)
      setPreparationModalOpen(true)
    })
  }

  const handleUpdatePreparedQuantity = (itemIndex, newQuantity) => {
    setPreparationItems((prev) => {
      const updated = [...prev]
      const item = updated[itemIndex]
      
      if (!item) return prev

      const orderedQuantity = item.orderedQuantity || item.quantity
      const preparedQuantity = Math.max(0, newQuantity)
      const gap = orderedQuantity - preparedQuantity

      updated[itemIndex] = {
        ...item,
        preparedQuantity,
        gap,
      }

      return updated
    })
  }

  const handleAddGapReason = (itemIndex, reason) => {
    setPreparationItems((prev) => {
      const updated = [...prev]
      if (updated[itemIndex]) {
        updated[itemIndex].gapReason = reason
      }
      return updated
    })
  }

  const handleConfirmPreparation = async () => {
    if (!selectedOrder) return

    try {
      // Préparer les données pour l'API
      const preparedItems = preparationItems.map((item) => ({
        productId: item.productId,
        unit: item.unit,
        preparedQuantity: item.preparedQuantity || 0,
        gapReason: item.gapReason || null,
      }))

      // Appeler l'API pour préparer la commande
      await prepareOrder(selectedOrder.id, preparedItems, user.id)

      showSuccess('Commande préparée avec succès')
      setPreparationModalOpen(false)
      setSelectedOrder(null)
      setPreparationItems([])
      loadOrders()
    } catch (error) {
      showError('Erreur lors de la préparation de la commande')
      console.error(error)
    }
  }

  const handleMarkReady = async (orderId) => {
    try {
      await markOrderReady(orderId)
      showSuccess('Commande marquée comme prête')
      loadOrders()
    } catch (error) {
      showError('Erreur lors de la mise à jour de la commande')
      console.error(error)
    }
    setConfirmDialog({ isOpen: false, orderId: null })
  }

  const ordersToPrepare = orders.filter((o) => o.status === 'confirmée')
  const ordersInPreparation = orders.filter((o) => o.status === 'en_préparation')

  return (
    <ProtectedRoute requiredResource={RESOURCES.ORDERS} requiredAction={ACTIONS.PREPARE}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Préparation des Commandes
          </h1>
          {activeStore && (
            <p className="text-gray-600">
              {activeStore.name} - Commandes à préparer et en cours de préparation
            </p>
          )}
        </div>

        {/* Alertes */}
        {ordersToPrepare.length > 0 && (
          <div className="card bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {ordersToPrepare.length} commande(s) à préparer
                </h3>
                <p className="text-sm text-gray-600">
                  Commencez la préparation de ces commandes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Commandes à préparer */}
        {ordersToPrepare.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary-600" />
                <span>Commandes à préparer ({ordersToPrepare.length})</span>
              </h2>
            </div>

            <div className="space-y-4">
              {ordersToPrepare.map((order) => (
                <div
                  key={order.id}
                  className="p-5 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-bold text-gray-900 text-lg">
                          {order.orderNumber}
                        </span>
                        <OrderStatusBadge status={order.status} />
                        <span className="text-sm text-gray-600">
                          {format(new Date(order.createdAt), 'dd MMM yyyy à HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Livraison prévue :</span>{' '}
                        {format(new Date(order.deliveryDate), 'dd MMMM yyyy')}
                      </p>
                      <p className="text-lg font-bold text-primary-600">
                        {order.totalTTC?.toFixed(2) || order.total?.toFixed(2)} € TTC
                      </p>
                    </div>
                    {canPrepare && (
                      <button
                        onClick={() => handleStartPreparation(order)}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        <Package className="h-4 w-4" />
                        <span>Préparer</span>
                      </button>
                    )}
                  </div>

                  {/* Articles de la commande */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Articles ({order.items?.length || 0})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {order.items?.slice(0, 4).map((item, index) => (
                        <div
                          key={index}
                          className="p-2 bg-gray-50 rounded-lg text-sm"
                        >
                          <p className="font-medium text-gray-900">
                            {item.product?.name || 'Produit'}
                          </p>
                          <p className="text-gray-600">
                            {item.orderedQuantity || item.quantity} {item.unit}
                          </p>
                        </div>
                      ))}
                      {order.items?.length > 4 && (
                        <div className="p-2 bg-gray-50 rounded-lg text-sm flex items-center justify-center">
                          <span className="text-gray-600">
                            +{order.items.length - 4} autre(s)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commandes en préparation */}
        {ordersInPreparation.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary-600" />
                <span>En cours de préparation ({ordersInPreparation.length})</span>
              </h2>
            </div>

            <div className="space-y-4">
              {ordersInPreparation.map((order) => (
                <div
                  key={order.id}
                  className="p-5 bg-gradient-to-r from-blue-50 to-primary-50 rounded-xl border border-primary-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-bold text-gray-900 text-lg">
                          {order.orderNumber}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      {order.items?.some((item) => item.gap && item.gap !== 0) && (
                        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                          <div className="flex items-center space-x-2 text-yellow-800 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">
                              Écarts détectés entre commandé et préparé
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    {canMarkReady && (
                      <button
                        onClick={() =>
                          setConfirmDialog({ isOpen: true, orderId: order.id })
                        }
                        className="btn btn-success flex items-center space-x-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Marquer prête</span>
                      </button>
                    )}
                  </div>

                  {/* Articles avec écarts */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-2">
                        {order.items.map((item, index) => {
                          const orderedQty = item.orderedQuantity || item.quantity
                          const preparedQty = item.preparedQuantity
                          const gap = item.gap || 0

                          return (
                            <div
                              key={index}
                              className={`p-3 rounded-lg ${
                                gap !== 0
                                  ? 'bg-yellow-50 border border-yellow-200'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {item.product?.name || 'Produit'}
                                  </p>
                                  <div className="flex items-center space-x-4 mt-1 text-sm">
                                    <span className="text-gray-600">
                                      Commandé : <span className="font-medium">{orderedQty}</span> {item.unit}
                                    </span>
                                    <span className="text-gray-600">
                                      Préparé : <span className="font-medium">{preparedQty || orderedQty}</span> {item.unit}
                                    </span>
                                    {gap !== 0 && (
                                      <span className="text-yellow-700 font-medium">
                                        Écart : {gap > 0 ? '-' : '+'}{Math.abs(gap)} {item.unit}
                                      </span>
                                    )}
                                  </div>
                                  {item.gapReason && (
                                    <p className="text-xs text-gray-600 mt-1 italic">
                                      Raison : {item.gapReason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message si aucune commande */}
        {orders.length === 0 && !loading && (
          <div className="card text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune commande à préparer
            </h2>
            <p className="text-gray-600">
              Toutes les commandes sont préparées ou aucune commande confirmée
            </p>
          </div>
        )}

        {/* Modal de préparation */}
        <Modal
          isOpen={preparationModalOpen}
          onClose={() => {
            setPreparationModalOpen(false)
            setSelectedOrder(null)
            setPreparationItems([])
          }}
          title={`Préparer la commande ${selectedOrder?.orderNumber}`}
          size="xl"
        >
          {selectedOrder && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Client :</span> {selectedOrder.clientId}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Livraison prévue :</span>{' '}
                  {format(new Date(selectedOrder.deliveryDate), 'dd MMMM yyyy')}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Ajuster les quantités préparées
                </h3>
                {preparationItems.map((item, index) => {
                  const orderedQty = item.orderedQuantity || item.quantity
                  const preparedQty = item.preparedQuantity || 0
                  const gap = orderedQty - preparedQty
                  const hasGap = gap !== 0

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${
                        hasGap
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-lg">
                            {item.product?.name || 'Produit'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Stock disponible : <span className="font-medium">{item.availableStock || 0}</span> {item.unit}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantité commandée
                          </label>
                          <div className="p-3 bg-gray-50 rounded-lg text-center">
                            <span className="text-lg font-bold text-gray-900">
                              {orderedQty} {item.unit}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantité préparée
                          </label>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                handleUpdatePreparedQuantity(
                                  index,
                                  preparedQty - 1
                                )
                              }
                              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                              disabled={preparedQty <= 0}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={preparedQty}
                              onChange={(e) =>
                                handleUpdatePreparedQuantity(
                                  index,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="flex-1 p-3 border border-gray-300 rounded-lg text-center font-bold text-lg"
                            />
                            <button
                              onClick={() =>
                                handleUpdatePreparedQuantity(
                                  index,
                                  preparedQty + 1
                                )
                              }
                              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {hasGap && (
                        <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">
                              Écart : {gap > 0 ? '-' : '+'}{Math.abs(gap)} {item.unit}
                            </span>
                          </div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Raison de l'écart (optionnel)
                          </label>
                          <textarea
                            value={item.gapReason || ''}
                            onChange={(e) => handleAddGapReason(index, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            rows="2"
                            placeholder="Ex: Stock insuffisant, produit endommagé..."
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setPreparationModalOpen(false)
                    setSelectedOrder(null)
                    setPreparationItems([])
                  }}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmPreparation}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirmer la préparation</span>
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Dialog de confirmation */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ isOpen: false, orderId: null })}
          onConfirm={() => handleMarkReady(confirmDialog.orderId)}
          title="Marquer la commande comme prête"
          message="Êtes-vous sûr de vouloir marquer cette commande comme prête ? Elle sera alors disponible pour la livraison."
          confirmText="Marquer prête"
          type="info"
        />

        {/* Toast */}
        <Toast {...toast} onClose={hideToast} />
      </div>
    </ProtectedRoute>
  )
}

export default Preparation
