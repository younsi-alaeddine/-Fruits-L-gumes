import apiClient from '../config/api'

// Récupérer toutes les settings ou par catégorie
export async function getSettings(category = null) {
  const params = category ? { category } : {}
  const response = await apiClient.get('/settings', { params })
  return response.data
}

// Récupérer une setting spécifique
export async function getSetting(key) {
  const response = await apiClient.get(`/settings/${key}`)
  return response.data
}

// Mettre à jour plusieurs settings
export async function updateSettings(settings) {
  const response = await apiClient.put('/settings', { settings })
  return response.data
}

// Mettre à jour une setting spécifique
export async function updateSetting(key, value) {
  const response = await apiClient.put(`/settings/${key}`, { value })
  return response.data
}
