import apiClient from '../config/api'

// Liste des prix
export async function getPrices(params = {}) {
  const response = await apiClient.get('/prices', { params })
  return response.data
}

// Détails d'un prix
export async function getPrice(id) {
  const response = await apiClient.get(`/prices/${id}`)
  return response.data
}

// Mettre à jour un prix
export async function updatePrice(id, data) {
  const response = await apiClient.put(`/prices/${id}`, data)
  return response.data
}

// Bulk update prix
export async function bulkUpdatePrices(data) {
  const response = await apiClient.post('/prices/bulk-update', data)
  return response.data
}

// Historique des prix
export async function getPriceHistory(productId, params = {}) {
  const response = await apiClient.get(`/prices/history/${productId}`, { params })
  return response.data
}

// Tarifs volume
export async function getVolumePricing(productId) {
  const response = await apiClient.get(`/prices/volume/${productId}`)
  return response.data
}

export async function createVolumePricing(data) {
  const response = await apiClient.post('/prices/volume', data)
  return response.data
}

export async function updateVolumePricing(id, data) {
  const response = await apiClient.put(`/prices/volume/${id}`, data)
  return response.data
}

export async function deleteVolumePricing(id) {
  const response = await apiClient.delete(`/prices/volume/${id}`)
  return response.data
}

// Tarifs clients
export async function getClientPricing(params = {}) {
  const response = await apiClient.get('/prices/client-pricing', { params })
  return response.data
}

export async function createClientPricing(data) {
  const response = await apiClient.post('/prices/client-pricing', data)
  return response.data
}

export async function updateClientPricing(id, data) {
  const response = await apiClient.put(`/prices/client-pricing/${id}`, data)
  return response.data
}

export async function deleteClientPricing(id) {
  const response = await apiClient.delete(`/prices/client-pricing/${id}`)
  return response.data
}

// Stats
export async function getPriceStats() {
  const response = await apiClient.get('/prices/stats')
  return response.data
}

// Import/Export CSV
export async function importPricesCSV(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await apiClient.post('/prices/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export async function exportPricesCSV(params = {}) {
  const response = await apiClient.get('/prices/export-csv', {
    params,
    responseType: 'blob'
  })
  
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `prix-${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  
  return response.data
}
