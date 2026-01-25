import apiClient from '../config/api'
import { getMe } from './auth'

/**
 * Récupérer la liste des utilisateurs (ADMIN)
 */
export async function getUsers(params = {}) {
  const response = await apiClient.get('/admin/users', { params })
  return response.data
}

/**
 * Utilisateurs de l'organisation du manager
 * GET /api/manager/users
 */
export async function getManagerUsers(params = {}) {
  const response = await apiClient.get('/manager/users', { params })
  return response.data
}

/**
 * Récupérer un utilisateur par ID
 */
export async function getUser(id) {
  const response = await apiClient.get(`/admin/users/${id}`)
  return response.data
}

/**
 * Créer un nouvel utilisateur
 */
export async function createUser(data) {
  const response = await apiClient.post('/admin/users', data)
  return response.data
}

/**
 * Mettre à jour un utilisateur
 */
export async function updateUser(id, data) {
  const response = await apiClient.put(`/admin/users/${id}`, data)
  return response.data
}

/**
 * Supprimer un utilisateur
 */
export async function deleteUser(id) {
  const response = await apiClient.delete(`/admin/users/${id}`)
  return response.data
}

/**
 * Changer le rôle d'un utilisateur
 */
export async function changeUserRole(id, role, scopeType, scopeId) {
  const response = await apiClient.put(`/admin/users/${id}/role`, {
    role,
    scopeType,
    scopeId,
  })
  return response.data
}

/**
 * Activer/désactiver un utilisateur
 */
export async function toggleUserStatus(id, isActive) {
  const response = await apiClient.put(`/admin/users/${id}/status`, { isActive })
  return response.data
}

/**
 * Mettre à jour le profil utilisateur
 */
export async function updateUserProfile(data, ...args) {
  // Vérification : si plusieurs arguments sont passés, c'est une erreur (ancien format)
  if (args.length > 0) {
    console.error('❌ ERREUR: updateUserProfile appelé avec plusieurs arguments (ancien format):', data, args)
    console.error('❌ Utilisez updateUserProfile({ name: "...", phone: "..." }) au lieu de updateUserProfile(user.id, {...})')
    throw new Error('Format incorrect: utilisez updateUserProfile({ name: "...", phone: "..." })')
  }
  
  // Vérification de sécurité : s'assurer que data est un objet
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    console.error('❌ ERREUR: updateUserProfile reçoit des données invalides:', data, 'Type:', typeof data)
    throw new Error('Les données doivent être un objet')
  }
  
  // Vérifier que ce n'est pas l'ID utilisateur qui est passé par erreur
  if (typeof data === 'string' || (typeof data === 'object' && Object.keys(data).length === 0 && data.constructor === Object)) {
    console.error('❌ ERREUR: updateUserProfile reçoit des données vides ou invalides:', data)
    throw new Error('Les données doivent contenir name et/ou phone')
  }
  
  console.log('📤 updateUserProfile appelé avec:', JSON.stringify(data), 'Type:', typeof data)
  console.log('📤 Keys:', Object.keys(data))
  
  // S'assurer que les données sont bien sérialisées
  const requestData = {
    name: data.name || null,
    phone: data.phone || null,
  }
  
  console.log('📤 Données finales envoyées:', JSON.stringify(requestData))
  
  const response = await apiClient.put('/auth/profile', requestData, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user))
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: response.data.user }))
  }
  return response.data
}

/**
 * Changer le mot de passe utilisateur
 */
export async function changeUserPassword(currentPassword, newPassword) {
  const response = await apiClient.put('/auth/change-password', {
    currentPassword,
    newPassword,
  })
  return response.data
}

/**
 * Changer la photo de profil (upload)
 */
export async function uploadProfileAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)
  await apiClient.post('/auth/avatar', formData)
  const data = await getMe()
  if (data?.user) {
    const cacheBust = Date.now()
    const avatarUrl = data.user.avatarUrl
      ? `${data.user.avatarUrl}${data.user.avatarUrl.includes('?') ? '&' : '?'}v=${cacheBust}`
      : null
    const updatedUser = { ...data.user, avatarUrl }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }))
  }
  return data
}

/**
 * Réinitialiser le mot de passe d'un utilisateur (Admin)
 */
export async function resetUserPassword(userId, newPassword) {
  const response = await apiClient.put(`/admin/users/${userId}/password`, {
    newPassword,
  })
  return response.data
}

/**
 * Obtenir les rôles assignés d'un utilisateur
 */
export async function getUserRoles(userId) {
  const response = await apiClient.get(`/admin/users/${userId}/roles`)
  return response.data
}

/**
 * Assigner un rôle à un utilisateur
 */
export async function assignRole(userId, role, scopeType, scopeId) {
  const response = await apiClient.post(`/admin/users/${userId}/roles`, {
    role,
    scopeType,
    scopeId,
  })
  return response.data
}

/**
 * Retirer un rôle d'un utilisateur
 */
export async function removeRole(userId, roleAssignmentId) {
  const response = await apiClient.delete(`/admin/users/${userId}/roles/${roleAssignmentId}`)
  return response.data
}

/**
 * Obtenir l'historique des actions d'un utilisateur
 */
export async function getUserActivity(userId) {
  const response = await apiClient.get(`/admin/users/${userId}/activity`)
  return response.data
}

/**
 * Approuver un utilisateur (Admin)
 */
export async function approveUser(userId) {
  const response = await apiClient.put(`/admin/users/${userId}/approve`)
  return response.data
}

/**
 * Rejeter un utilisateur (retirer l'approbation) (Admin)
 */
export async function rejectUser(userId) {
  const response = await apiClient.put(`/admin/users/${userId}/reject`)
  return response.data
}
