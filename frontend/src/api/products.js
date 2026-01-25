import apiClient from '../config/api'

export async function getProducts(params = {}) {
  const response = await apiClient.get('/products', { params })
  return response.data
}

export async function getProduct(id) {
  const response = await apiClient.get(`/products/${id}`)
  return response.data
}

export async function createProduct(data) {
  const response = await apiClient.post('/products', data)
  return response.data
}

export async function updateProduct(id, data) {
  const response = await apiClient.put(`/products/${id}`, data)
  return response.data
}

export async function deleteProduct(id) {
  const response = await apiClient.delete(`/products/${id}`)
  return response.data
}

export async function searchProducts(query) {
  const response = await apiClient.get('/products/search', {
    params: { q: query },
  })
  return response.data
}

export async function uploadProductImage(id, file) {
  const formData = new FormData()
  formData.append('image', file)
  
  const response = await apiClient.post(`/products/${id}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export async function getProductCategories() {
  const response = await apiClient.get('/categories')
  return response.data
}
