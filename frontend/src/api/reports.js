import apiClient from '../config/api'

// Rapport ventes
export async function getSalesReport(params = {}) {
  const response = await apiClient.get('/reports/sales', { params })
  return response.data
}

// Rapport produits
export async function getProductsReport(params = {}) {
  const response = await apiClient.get('/reports/products', { params })
  return response.data
}

// Rapport catégories
export async function getCategoriesReport(params = {}) {
  const response = await apiClient.get('/reports/categories', { params })
  return response.data
}

// Rapport clients
export async function getClientsReport(params = {}) {
  const response = await apiClient.get('/reports/clients', { params })
  return response.data
}

// Rapport tendances
export async function getTrendsReport(params = {}) {
  const response = await apiClient.get('/reports/trends', { params })
  return response.data
}

// Rapport performance global
export async function getPerformanceReport(params = {}) {
  const response = await apiClient.get('/reports/performance', { params })
  return response.data
}

// Export Excel
export async function exportSalesExcel(params = {}) {
  const response = await apiClient.get('/reports/sales', {
    params: { ...params, format: 'excel' },
    responseType: 'blob'
  })
  
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `rapport-ventes-${Date.now()}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  
  return response.data
}

// Legacy (compatibilité)
export async function getOrdersReport(params = {}) {
  return getSalesReport(params)
}

export async function getMarginsReport(params = {}) {
  return getPerformanceReport(params)
}

export async function getStoresReport(params = {}) {
  return getClientsReport(params)
}
