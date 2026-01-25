import apiClient from '../config/api'

export async function getSales(params = {}) {
  const response = await apiClient.get('/orders', {
    params: { ...params, status: 'LIVREE' },
  })
  return response.data
}

export async function getSaleDetails(id) {
  const response = await apiClient.get('/orders/' + id)
  return response.data
}

export async function getSalesStats(params = {}) {
  const response = await apiClient.get('/admin/stats/sales-evolution', { params })
  return response.data
}

export async function getSalesReport(params = {}) {
  const response = await apiClient.get('/reports/orders', { params })
  return response.data
}
