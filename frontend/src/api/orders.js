import apiClient from '../config/api'

/**
 * Récupérer la liste des commandes
 */
export async function getOrders(params = {}) {
  const response = await apiClient.get('/orders', { params })
  return response.data
}

/**
 * Récupérer une commande par ID
 */
export async function getOrder(id) {
  const response = await apiClient.get(`/orders/${id}`)
  return response.data
}

/**
 * Créer une nouvelle commande
 */
export async function createOrder(data) {
  const response = await apiClient.post('/orders', data)
  return response.data
}

/**
 * Mettre à jour une commande
 */
export async function updateOrder(id, data) {
  const response = await apiClient.put(`/orders/${id}`, data)
  return response.data
}

/**
 * Confirmer une commande (ADMIN)
 */
export async function confirmOrder(id) {
  const response = await apiClient.put(`/orders/${id}/confirm`)
  return response.data
}

/**
 * Annuler une commande
 */
export async function cancelOrder(id, reason) {
  const response = await apiClient.put(`/orders/${id}/cancel`, { reason })
  return response.data
}

/**
 * Marquer une commande comme livrée
 */
export async function deliverOrder(id) {
  const response = await apiClient.put(`/orders/${id}/deliver`)
  return response.data
}

/**
 * Récupérer les commandes à préparer (SUPPLIER_ORDERED)
 */
export async function getOrdersToPrepare(storeId) {
  const params = { status: 'SUPPLIER_ORDERED' }
  if (storeId) params.storeId = storeId
  const response = await apiClient.get('/orders', { params })
  return response.data
}

/**
 * Récupérer les commandes en préparation (PREPARATION)
 */
export async function getOrdersInPreparation(storeId) {
  const params = { status: 'PREPARATION' }
  if (storeId) params.storeId = storeId
  const response = await apiClient.get('/orders', { params })
  return response.data
}

/**
 * Marquer une commande en préparation
 */
export async function prepareOrder(id) {
  const response = await apiClient.put(`/orders/${id}/prepare`)
  return response.data
}

/**
 * Marquer une commande comme prête
 */
export async function markOrderReady(id) {
  const response = await apiClient.put(`/orders/${id}/ready`)
  return response.data
}

/**
 * Télécharger le PDF d'une commande
 */
export async function downloadOrderPDF(id) {
  const response = await apiClient.get(`/orders/${id}/pdf`, {
    responseType: 'blob',
  })
  return response.data
}

/**
 * Récupérer le contexte de commande (horaires autorisés)
 */
export async function getOrderContext() {
  const response = await apiClient.get('/order-context')
  return response.data
}

/**
 * ✅ NOUVEAU : Agrège les commandes NEW par date de livraison
 */
export async function aggregateOrders(deliveryDate) {
  const response = await apiClient.post('/orders/aggregate', { deliveryDate })
  return response.data
}

/**
 * ✅ NOUVEAU : Crée une commande fournisseur depuis les commandes agrégées
 */
export async function createSupplierOrderFromAggregation(supplierId, deliveryDate) {
  const response = await apiClient.post('/orders/aggregated/create-supplier-order', {
    supplierId,
    deliveryDate
  })
  return response.data
}
