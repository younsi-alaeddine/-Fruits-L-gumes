import apiClient from '../config/api'

/**
 * Récupérer tous les templates d'email
 */
export async function getEmailTemplates() {
  const response = await apiClient.get('/emails/templates')
  return response.data
}

/**
 * Récupérer un template d'email par ID
 */
export async function getEmailTemplate(id) {
  const response = await apiClient.get(`/emails/templates/${id}`)
  return response.data
}

/**
 * Créer un nouveau template d'email
 */
export async function createEmailTemplate(data) {
  const response = await apiClient.post('/emails/templates', data)
  return response.data
}

/**
 * Mettre à jour un template d'email
 */
export async function updateEmailTemplate(id, data) {
  const response = await apiClient.put(`/emails/templates/${id}`, data)
  return response.data
}

/**
 * Supprimer un template d'email
 */
export async function deleteEmailTemplate(id) {
  const response = await apiClient.delete(`/emails/templates/${id}`)
  return response.data
}

/**
 * Envoyer un email
 */
export async function sendEmail(data) {
  const response = await apiClient.post('/emails/send', data)
  return response.data
}
