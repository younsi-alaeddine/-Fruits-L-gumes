import apiClient from '../config/api'

// Liste des stocks
export async function getStocks(params = {}) {
  const response = await apiClient.get('/stock', { params })
  return response.data
}

// Stock d'un produit spécifique pour un magasin
export async function getStock(shopId, productId) {
  const response = await apiClient.get('/stock', {
    params: { shopId, productId }
  })
  return response.data
}

// Mise à jour du stock d'un produit
export async function updateStock(productId, data) {
  const response = await apiClient.put(`/stock/${productId}`, data)
  return response.data
}

// Ajuster le stock (ajouter ou retirer)
export async function adjustStock(productId, quantity, reason = '') {
  const response = await apiClient.post(`/stock/${productId}/adjust`, {
    quantity,
    reason
  })
  return response.data
}

// Alertes stock bas
export async function getStockAlerts() {
  const response = await apiClient.get('/stock/alerts')
  return response.data
}

// Statistiques stocks
export async function getStockStats() {
  const response = await apiClient.get('/stock/stats')
  return response.data
}

// Historique mouvements
export async function getStockMovements(productId, params = {}) {
  const response = await apiClient.get(`/stock/movements/${productId}`, { params })
  return response.data
}

// Inventaire physique
export async function createInventory(data) {
  const response = await apiClient.post('/stock/inventory', data)
  return response.data
}
