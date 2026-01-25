import apiClient from '../config/api'

// Liste des paiements
export async function getPayments(params = {}) {
  const response = await apiClient.get('/payments', { params })
  return response.data
}

// Détails d'un paiement
export async function getPayment(id) {
  const response = await apiClient.get(`/payments/${id}`)
  return response.data
}

// Paiements d'une commande
export async function getOrderPayments(orderId) {
  const response = await apiClient.get(`/payments/order/${orderId}`)
  return response.data
}

// Créer un paiement
export async function createPayment(data) {
  const response = await apiClient.post('/payments', data)
  return response.data
}

// Modifier un paiement
export async function updatePayment(id, data) {
  const response = await apiClient.put(`/payments/${id}`, data)
  return response.data
}

// Supprimer un paiement
export async function deletePayment(id) {
  const response = await apiClient.delete(`/payments/${id}`)
  return response.data
}

// Télécharger reçu PDF
export async function downloadReceipt(id) {
  const response = await apiClient.get(`/payments/${id}/download-receipt`, {
    responseType: 'blob'
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `recu-paiement-${id}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

// Statistiques
export async function getPaymentStats(params = {}) {
  const response = await apiClient.get('/payments/stats', { params })
  return response.data
}

// Échéancier
export async function getPaymentSchedule(days = 30) {
  const response = await apiClient.get('/payments/schedule', { params: { days } })
  return response.data
}

// Paiements en retard (recouvrement)
export async function getOverduePayments() {
  const response = await apiClient.get('/payments/overdue')
  return response.data
}

// Marquer comme payé
export async function markAsPaid(id) {
  const response = await apiClient.post(`/payments/${id}/mark-paid`)
  return response.data
}
