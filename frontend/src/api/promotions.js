import apiClient from '../config/api'

// Liste des promotions
export async function getPromotions(params = {}) {
  const response = await apiClient.get('/promotions', { params })
  return response.data
}

// Détails d'une promotion
export async function getPromotion(id) {
  const response = await apiClient.get(`/promotions/${id}`)
  return response.data
}

// Valider un code promo
export async function validatePromoCode(code, amount = 0) {
  const response = await apiClient.get(`/promotions/${code}/validate`, {
    params: { amount }
  })
  return response.data
}

// Créer une promotion
export async function createPromotion(data) {
  const response = await apiClient.post('/promotions', data)
  return response.data
}

// Mettre à jour une promotion
export async function updatePromotion(id, data) {
  const response = await apiClient.put(`/promotions/${id}`, data)
  return response.data
}

// Supprimer une promotion
export async function deletePromotion(id) {
  const response = await apiClient.delete(`/promotions/${id}`)
  return response.data
}

// Désactiver une promotion
export async function deactivatePromotion(id) {
  const response = await apiClient.put(`/promotions/${id}`, { isActive: false })
  return response.data
}

// Activer une promotion
export async function activatePromotion(id) {
  const response = await apiClient.put(`/promotions/${id}`, { isActive: true })
  return response.data
}

// Statistiques d'utilisation
export async function getPromotionStats(id) {
  const response = await apiClient.get(`/promotions/${id}/stats`)
  return response.data
}
