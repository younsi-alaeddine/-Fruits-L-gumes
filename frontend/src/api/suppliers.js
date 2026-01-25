import apiClient from '../config/api'

// Liste des fournisseurs
export async function getSuppliers(params = {}) {
  const response = await apiClient.get('/suppliers', { params })
  return response.data
}

// Détails d'un fournisseur
export async function getSupplier(id) {
  const response = await apiClient.get(`/suppliers/${id}`)
  return response.data
}

// Créer un fournisseur
export async function createSupplier(data) {
  const response = await apiClient.post('/suppliers', data)
  return response.data
}

// Mettre à jour un fournisseur
export async function updateSupplier(id, data) {
  const response = await apiClient.put(`/suppliers/${id}`, data)
  return response.data
}

// Supprimer un fournisseur
export async function deleteSupplier(id) {
  const response = await apiClient.delete(`/suppliers/${id}`)
  return response.data
}

// Catalogue produits du fournisseur
export async function getSupplierCatalog(supplierId, params = {}) {
  const response = await apiClient.get(`/suppliers/${supplierId}/catalog`, { params })
  return response.data
}

export async function addProductToCatalog(supplierId, data) {
  const response = await apiClient.post(`/suppliers/${supplierId}/catalog`, data)
  return response.data
}

export async function updateCatalogProduct(supplierId, productId, data) {
  const response = await apiClient.put(`/suppliers/${supplierId}/catalog/${productId}`, data)
  return response.data
}

export async function removeCatalogProduct(supplierId, productId) {
  const response = await apiClient.delete(`/suppliers/${supplierId}/catalog/${productId}`)
  return response.data
}

// Commandes fournisseurs
export async function getSupplierOrders(params = {}) {
  const response = await apiClient.get('/suppliers/orders', { params })
  return response.data
}

export async function getSupplierOrder(id) {
  const response = await apiClient.get(`/suppliers/orders/${id}`)
  return response.data
}

export async function createSupplierOrder(data) {
  const response = await apiClient.post('/suppliers/orders', data)
  return response.data
}

export async function updateSupplierOrder(id, data) {
  const response = await apiClient.put(`/suppliers/orders/${id}`, data)
  return response.data
}

export async function receiveSupplierOrder(id, data) {
  const response = await apiClient.post(`/suppliers/orders/${id}/receive`, data)
  return response.data
}

// Évaluations fournisseurs
export async function getSupplierEvaluations(supplierId) {
  const response = await apiClient.get(`/suppliers/${supplierId}/evaluations`)
  return response.data
}

export async function createSupplierEvaluation(supplierId, data) {
  const response = await apiClient.post(`/suppliers/${supplierId}/evaluations`, data)
  return response.data
}

// Stats
export async function getSupplierStats(supplierId) {
  const response = await apiClient.get(`/suppliers/${supplierId}/stats`)
  return response.data
}

export async function getAllSuppliersStats() {
  const response = await apiClient.get('/suppliers/stats')
  return response.data
}

// Import/Export CSV
export async function importSuppliersCSV(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await apiClient.post('/suppliers/import-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export async function exportSuppliersCSV(params = {}) {
  const response = await apiClient.get('/suppliers/export-csv', {
    params,
    responseType: 'blob'
  })
  
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `fournisseurs-${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  
  return response.data
}
