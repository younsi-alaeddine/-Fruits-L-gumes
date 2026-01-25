import apiClient from '../config/api'

export async function getNotifications(params = {}) {
  const response = await apiClient.get('/notifications', { params })
  return response.data
}

export async function markAsRead(id) {
  const response = await apiClient.put('/notifications/' + id + '/read')
  return response.data
}

export async function markAllAsRead() {
  const response = await apiClient.put('/notifications/read-all')
  return response.data
}

export async function deleteNotification(id) {
  const response = await apiClient.delete('/notifications/' + id)
  return response.data
}

export async function getUnreadCount() {
  const response = await apiClient.get('/notifications/unread-count')
  return response.data
}
