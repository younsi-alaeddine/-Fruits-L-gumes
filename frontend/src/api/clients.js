import apiClient from '../config/api'

export async function getClients(params = {}) {
  const response = await apiClient.get('/shops', { params })
  return response.data
}

export async function getClient(id) {
  const response = await apiClient.get('/shops/' + id)
  return response.data
}

export async function createClient(data) {
  const response = await apiClient.post('/shops', data)
  return response.data
}

export async function updateClient(id, data) {
  const response = await apiClient.put('/shops/' + id, data)
  return response.data
}

export async function deleteClient(id) {
  const response = await apiClient.delete('/shops/' + id)
  return response.data
}
