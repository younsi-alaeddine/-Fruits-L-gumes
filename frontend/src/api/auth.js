import apiClient from '../config/api'

/**
 * Connexion utilisateur
 */
export async function login(email, password) {
  const response = await apiClient.post('/auth/login', { email, password })
  
  // L'API backend retourne accessToken, pas token
  if (response.data.accessToken) {
    localStorage.setItem('token', response.data.accessToken)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    if (response.data.csrfToken) localStorage.setItem('csrfToken', response.data.csrfToken)
  }
  
  return response.data
}

/**
 * Inscription utilisateur
 */
export async function register(userData) {
  const response = await apiClient.post('/auth/register', userData)
  return response.data
}

/**
 * Déconnexion utilisateur
 */
export async function logout() {
  try {
    await apiClient.post('/auth/logout')
  } catch (error) {
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('csrfToken')
  }
}

/**
 * Récupérer le profil de l'utilisateur connecté
 */
export async function getMe() {
  const response = await apiClient.get('/auth/me')
  
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user))
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: response.data.user }))
  }
  
  return response.data
}

/**
 * Mettre à jour le profil utilisateur
 */
export async function updateUserProfile(data) {
  const response = await apiClient.put('/auth/profile', data)
  return response.data
}

/**
 * Changer le mot de passe
 */
export async function changeUserPassword(currentPassword, newPassword) {
  const response = await apiClient.put('/auth/change-password', {
    currentPassword,
    newPassword,
  })
  return response.data
}

/**
 * Demander une réinitialisation de mot de passe
 */
export async function requestPasswordReset(email) {
  const response = await apiClient.post('/auth/forgot-password', { email })
  return response.data
}

/**
 * Réinitialiser le mot de passe avec le token
 */
export async function resetPassword(token, newPassword) {
  const response = await apiClient.post('/auth/reset-password', {
    token,
    newPassword,
  })
  return response.data
}

/**
 * Renvoyer l'email de vérification
 */
export async function resendVerificationEmail(email) {
  const response = await apiClient.post('/auth/resend-verification', { email })
  return response.data
}

/**
 * Vérifier l'email avec le token reçu par email
 */
export async function verifyEmail(token) {
  const response = await apiClient.get('/auth/verify-email', { params: { token } })
  return response.data
}
