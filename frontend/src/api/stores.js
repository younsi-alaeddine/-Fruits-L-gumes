import apiClient from '../config/api'

/**
 * Récupérer la liste des magasins (shops) — ADMIN uniquement
 */
export async function getStores(params = {}) {
  const response = await apiClient.get('/shops', { params })
  return response.data
}

/**
 * Magasins accessibles par le CLIENT (organisation)
 * GET /api/client/shops
 */
export async function getClientShops(params = {}) {
  const response = await apiClient.get('/client/shops', { params })
  return response.data
}

/**
 * Détail d'un magasin CLIENT
 * GET /api/client/shops/:id
 */
export async function getClientShop(id) {
  const response = await apiClient.get(`/client/shops/${id}`)
  return response.data
}

/**
 * Magasins accessibles au MANAGER
 * GET /api/manager/shops
 */
export async function getManagerShops(params = {}) {
  const response = await apiClient.get('/manager/shops', { params })
  return response.data
}

/**
 * Récupérer un magasin par ID
 */
export async function getStore(id) {
  const response = await apiClient.get(`/shops/${id}`)
  return response.data
}

/**
 * Créer un nouveau magasin
 */
export async function createStore(data) {
  const response = await apiClient.post('/shops', data)
  return response.data
}

/**
 * Mettre à jour un magasin
 */
export async function updateStore(id, data) {
  const response = await apiClient.put(`/shops/${id}`, data)
  return response.data
}

/**
 * Supprimer un magasin
 */
export async function deleteStore(id) {
  const response = await apiClient.delete(`/shops/${id}`)
  return response.data
}

/**
 * Activer/désactiver un magasin
 */
export async function toggleStoreStatus(id, isActive) {
  const response = await apiClient.put(`/shops/${id}/status`, { isActive })
  return response.data
}

/**
 * Récupérer les statistiques d'un magasin
 */
export async function getStoreStats(id) {
  const response = await apiClient.get(`/shops/${id}/stats`)
  return response.data
}
