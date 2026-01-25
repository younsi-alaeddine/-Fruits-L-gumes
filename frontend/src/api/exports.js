import apiClient from '../config/api'

/**
 * Export des commandes
 */
export async function exportOrders(params = {}) {
  const response = await apiClient.get('/exports/orders', {
    params: { ...params, format: 'csv' },
    responseType: 'blob'
  })
  
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `commandes-${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  
  return response.data
}

/**
 * Export des produits
 */
export async function exportProducts(params = {}) {
  const response = await apiClient.get('/exports/products', {
    params: { ...params, format: 'csv' },
    responseType: 'blob'
  })
  
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `produits-${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  
  return response.data
}

/**
 * Export Excel des commandes
 */
export async function exportOrdersExcel(params = {}) {
  const response = await apiClient.get('/exports/orders', {
    params: { ...params, format: 'excel' },
    responseType: 'blob'
  })
  
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `commandes-${Date.now()}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  
  return response.data
}
