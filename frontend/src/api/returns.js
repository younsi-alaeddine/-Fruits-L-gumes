import apiClient from '../config/api'

// Liste des retours
export async function getReturns(params = {}) {
  const response = await apiClient.get('/returns', { params })
  return response.data
}

// Détails d'un retour
export async function getReturn(id) {
  const response = await apiClient.get(`/returns/${id}`)
  return response.data
}

// Créer un retour
export async function createReturn(data) {
  const formData = new FormData()
  
  formData.append('orderId', data.orderId)
  formData.append('reason', data.reason)
  if (data.description) formData.append('description', data.description)
  if (data.photo) formData.append('photo', data.photo)
  formData.append('items', JSON.stringify(data.items))
  
  const response = await apiClient.post('/returns', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

// Approuver un retour
export async function approveReturn(id, data) {
  const response = await apiClient.put(`/returns/${id}/approve`, data)
  return response.data
}

// Rejeter un retour
export async function rejectReturn(id, reason) {
  const response = await apiClient.put(`/returns/${id}/reject`, { reason })
  return response.data
}

// Statistiques retours
export async function getReturnStats() {
  const response = await apiClient.get('/returns/stats')
  return response.data
}
