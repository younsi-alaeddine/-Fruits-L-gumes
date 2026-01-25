import apiClient from '../config/api'

// Liste des factures
export async function getInvoices(params = {}) {
  const response = await apiClient.get('/invoices', { params })
  return response.data
}

// Détails d'une facture
export async function getInvoice(id) {
  const response = await apiClient.get(`/invoices/${id}`)
  return response.data
}

// Télécharger PDF
export async function downloadInvoicePDF(id) {
  const response = await apiClient.get(`/invoices/${id}/download`, {
    responseType: 'blob'
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `facture-${id}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

// Envoyer facture par email
export async function sendInvoiceEmail(id) {
  const response = await apiClient.post(`/invoices/${id}/send`)
  return response.data
}

// Statistiques avancées
export async function getInvoiceStats(params = {}) {
  const response = await apiClient.get('/invoices/stats/advanced', { params })
  return response.data
}

// Paiements
export async function getInvoicePayments(invoiceId) {
  const response = await apiClient.get(`/invoices/${invoiceId}/payments`)
  return response.data
}

export async function recordPayment(invoiceId, data) {
  const response = await apiClient.post(`/invoices/${invoiceId}/payments`, data)
  return response.data
}

// Avoirs (Credit Notes)
export async function createCreditNote(invoiceId, data) {
  const response = await apiClient.post(`/invoices/${invoiceId}/credit-note`, data)
  return response.data
}

export async function applyCreditNote(invoiceId, creditNoteId) {
  const response = await apiClient.post(`/invoices/${invoiceId}/credit-note/${creditNoteId}/apply`)
  return response.data
}

// Relances
export async function sendReminder(invoiceId) {
  const response = await apiClient.post(`/invoices/${invoiceId}/send-reminder`)
  return response.data
}

// Export comptable
export async function exportAccounting(params = {}) {
  const response = await apiClient.get('/invoices/export/accounting', { 
    params: { ...params, format: 'csv' },
    responseType: 'blob'
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `export-comptable-${Date.now()}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

// Facture proforma
export async function createProforma(data) {
  const response = await apiClient.post('/invoices/proforma', data)
  return response.data
}

// Générer facture depuis commande
export async function generateInvoiceFromOrder(orderId) {
  const response = await apiClient.post(`/invoices/orders/${orderId}/generate-invoice`)
  return response.data
}

// Marquer comme payée (legacy - utiliser recordPayment à la place)
export async function markAsPaid(id) {
  return recordPayment(id, {
    amount: 0, // Sera calculé automatiquement
    method: 'OTHER'
  })
}

// Export PDF (alias pour downloadInvoicePDF)
export const exportInvoicePDF = downloadInvoicePDF
