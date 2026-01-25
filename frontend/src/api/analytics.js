import apiClient from '../config/api'

export async function getGlobalKPI(params = {}) {
  const response = await apiClient.get('/admin/dashboard', { params })
  return response.data
}

export async function getPerformanceMetrics(params = {}) {
  const response = await apiClient.get('/admin/stats/sales-evolution', { params })
  return response.data
}

export async function getSalesByCategory(params = {}) {
  const response = await apiClient.get('/admin/stats/category-distribution', { params })
  return response.data
}

export async function getCustomerBehavior(params = {}) {
  // TODO: Implémenter dans backend
  return { data: [] }
}

export async function getForecast(params = {}) {
  // TODO: Implémenter dans backend
  return { data: [] }
}

export async function getFullDashboard(params = {}) {
  const response = await apiClient.get('/admin/dashboard', { params })
  return response.data
}

/**
 * Totaux globaux pour le tableau de bord ADMIN (clients, magasins, users, commandes, produits, commission).
 * GET /api/admin/stats/counts
 */
export async function getAdminDashboardCounts() {
  const response = await apiClient.get('/admin/stats/counts')
  return response.data
}
