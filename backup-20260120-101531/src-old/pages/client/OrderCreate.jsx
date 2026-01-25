import React, { useState, useEffect } from 'react'
import { Store, Calendar, AlertCircle, CheckCircle2, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import ProductList from '../../components/ProductList'
import CartSummary from '../../components/CartSummary'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import ProtectedRoute from '../../components/common/ProtectedRoute'
import { usePermission } from '../../hooks/usePermission'
import { RESOURCES, ACTIONS } from '../../constants/permissions'
import { ROUTES } from '../../constants/routes'
import { getStores } from '../../api/stores'
import { getProducts } from '../../api/products'
import { createOrder } from '../../api/orders'

/**
 * Page de création de commande - CLIENT
 * 
 * Logique métier importante :
 * - La commande peut être créée même si le stock est insuffisant
 * - Le stock n'est PAS bloqué lors de la création
 * - Le stock sera décrémenté uniquement lors de la préparation
 */
function OrderCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { stores, selectStore, selectedStoreId } = useStore()
  const { cartItems, clearCart } = useCart()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  const { canCreate } = usePermission(RESOURCES.ORDERS)
  
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [selectedStore, setSelectedStore] = useState(null)

  useEffect(() => {
    loadStores()
  }, [])

  useEffect(() => {
    if (selectedStoreId) {
      const store = stores.find((s) => s && s.id === selectedStoreId)
      setSelectedStore(store || null)
      if (store) {
        loadProducts(store.id)
      }
    }
  }, [selectedStoreId, stores])

  const loadStores = async () => {
    try {
      const response = await getStores()
      const clientStores = response.data || []
      if (clientStores.length > 0 && !selectedStoreId) {
        selectStore(clientStores[0].id)
      }
    } catch (error) {
      showError('Erreur lors du chargement des magasins')
      console.error(error)
    }
  }

  const loadProducts = async (storeId) => {
    try {
      setIsLoading(true)
      const response = await getProducts({ storeId })
      setProducts(response.data || [])
    } catch (error) {
      showError('Erreur lors du chargement des produits')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStoreChange = (storeId) => {
    selectStore(storeId)
    const store = stores.find((s) => s && s.id === storeId)
    setSelectedStore(store || null)
    if (store) {
      loadProducts(store.id)
    }
  }

  const handleSaveDraft = async () => {
    if (!selectedStore) {
      showError('Veuillez sélectionner un magasin')
      return
    }

    if (cartItems.length === 0) {
      showError('Votre panier est vide')
      return
    }

    if (!deliveryDate) {
      showError('Veuillez sélectionner une date de livraison')
      return
    }

    try {
      // IMPORTANT: Créer la commande même si le stock est insuffisant
      // Le stock ne sera pas bloqué ici
      const orderData = {
        storeId: selectedStore.id,
        clientId: user.clientId,
        deliveryDate,
        status: 'brouillon',
        items: cartItems.map((item) => ({
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
          orderedQuantity: item.quantity, // Quantité commandée (peut être > stock)
          unit: item.unit,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
        })),
        totalHT: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        taxRate: 0.20,
        createdBy: user.id,
      }

      const { data: order } = await createOrder(orderData)

      clearCart()
      showSuccess('Commande enregistrée en brouillon')
      
      // Rediriger vers la liste des commandes après un court délai
      setTimeout(() => {
        navigate(ROUTES.CLIENT.ORDERS)
      }, 1500)
    } catch (error) {
      showError('Erreur lors de l\'enregistrement de la commande')
      console.error(error)
    }
  }

  const handleSendOrder = async () => {
    if (!selectedStore) {
      showError('Veuillez sélectionner un magasin')
      return
    }

    if (cartItems.length === 0) {
      showError('Votre panier est vide')
      return
    }

    if (!deliveryDate) {
      showError('Veuillez sélectionner une date de livraison')
      return
    }

    try {
      // IMPORTANT: Créer la commande même si le stock est insuffisant
      const orderData = {
        storeId: selectedStore.id,
        clientId: user.clientId,
        deliveryDate,
        status: 'envoyée', // Commande envoyée au fournisseur
        items: cartItems.map((item) => ({
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
          orderedQuantity: item.quantity,
          unit: item.unit,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
        })),
        totalHT: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        taxRate: 0.20,
        createdBy: user.id,
      }

      const { data: order } = await createOrder(orderData)

      clearCart()
      showSuccess('Commande envoyée avec succès !')
      
      // Rediriger vers la liste des commandes
      setTimeout(() => {
        navigate(ROUTES.CLIENT.ORDERS)
      }, 1500)
    } catch (error) {
      showError('Erreur lors de l\'envoi de la commande')
      console.error(error)
    }
  }

  // Calculer la date minimale (aujourd'hui)
  const today = new Date().toISOString().split('T')[0]
  
  // Date maximale (30 jours à partir d'aujourd'hui)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateString = maxDate.toISOString().split('T')[0]

  // Vérifier les permissions
  if (!canCreate) {
    return (
      <ProtectedRoute requiredResource={RESOURCES.ORDERS} requiredAction={ACTIONS.CREATE}>
        <div className="card text-center py-12">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accès refusé
          </h2>
          <p className="text-gray-600">
            Vous n'avez pas la permission de créer des commandes
          </p>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="CLIENT" requiredResource={RESOURCES.ORDERS} requiredAction={ACTIONS.CREATE}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nouvelle commande
          </h1>
          <p className="text-gray-600">
            Sélectionnez un magasin et créez votre commande. Le stock ne sera pas bloqué lors de la création.
          </p>
        </div>

        {/* Sélection magasin et date */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Store className="inline h-4 w-4 mr-1" />
                Magasin / Dépôt
              </label>
              <select
                value={selectedStoreId || ''}
                onChange={(e) => handleStoreChange(e.target.value || null)}
                className="input"
                required
              >
                <option value="">Sélectionner un magasin</option>
                {stores.filter(store => store && store.id && store.name).map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.address?.street || store.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date de livraison souhaitée
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={today}
                max={maxDateString}
                className="input"
                required
              />
            </div>
          </div>

          {selectedStore && (
            <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-xl flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-primary-800">
                <p className="font-semibold mb-1">Magasin sélectionné: {selectedStore.name}</p>
                <p className="text-primary-700">{selectedStore.address?.street || selectedStore.address} - {selectedStore.address?.city || ''}</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Two Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Catalog */}
          <div className="lg:col-span-2">
            <ProductList products={products} isLoading={isLoading} />
          </div>

          {/* Right Column - Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              onSaveDraft={handleSaveDraft}
              onSendOrder={handleSendOrder}
            />
          </div>
        </div>

        {/* Toast */}
        <Toast {...toast} onClose={hideToast} />
      </div>
    </ProtectedRoute>
  )
}

export default OrderCreate
