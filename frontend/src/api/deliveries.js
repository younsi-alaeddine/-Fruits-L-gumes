import apiClient from '../config/api'

// Liste des livraisons
export async function getDeliveries(params = {}) {
  const response = await apiClient.get('/deliveries', { params })
  return response.data
}

// Détails d'une livraison
export async function getDelivery(id) {
  const response = await apiClient.get(`/deliveries/${id}`)
  return response.data
}

// Créer une livraison
export async function createDelivery(data) {
  const response = await apiClient.post('/deliveries', data)
  return response.data
}

// Mettre à jour une livraison
export async function updateDelivery(id, data) {
  const response = await apiClient.put(`/deliveries/${id}`, data)
  return response.data
}

// Assigner un livreur
export async function assignDriver(deliveryId, driverId, vehicleInfo = '') {
  const response = await apiClient.put(`/deliveries/${deliveryId}/assign`, {
    driverId,
    vehicleInfo
  })
  return response.data
}

// Marquer comme livrée (avec preuve)
export async function markAsDelivered(deliveryId, data) {
  const formData = new FormData()
  
  if (data.signature) formData.append('signature', data.signature)
  if (data.photo) formData.append('photo', data.photo)
  if (data.recipientName) formData.append('recipientName', data.recipientName)
  if (data.notes) formData.append('notes', data.notes)
  if (data.actualDeliveryTime) formData.append('actualDeliveryTime', data.actualDeliveryTime)
  
  const response = await apiClient.put(`/deliveries/${deliveryId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

// Calendrier des livraisons
export async function getDeliveriesCalendar(params = {}) {
  const response = await apiClient.get('/deliveries/calendar', { params })
  return response.data
}

// Télécharger bon de livraison (PDF)
export async function downloadDeliveryNote(deliveryId) {
  const response = await apiClient.get(`/deliveries/${deliveryId}/download-note`, {
    responseType: 'blob'
  })
  
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `bon-livraison-${deliveryId}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  
  return response.data
}

// Statistiques livraisons
export async function getDeliveryStats(params = {}) {
  const response = await apiClient.get('/deliveries/stats', { params })
  return response.data
}

// Optimiser tournée (suggestions)
export async function optimizeRoute(deliveryIds) {
  const response = await apiClient.post('/deliveries/optimize-route', { deliveryIds })
  return response.data
}
