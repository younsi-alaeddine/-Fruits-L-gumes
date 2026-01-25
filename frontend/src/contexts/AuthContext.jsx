import React, { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, getMe } from '../api/auth'

const AuthContext = createContext(null)

/**
 * Contexte d'authentification
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
      } catch (error) {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    setLoading(false)

    const handleUserUpdate = (event) => {
      if (event.detail) {
        setUser(event.detail)
        localStorage.setItem('user', JSON.stringify(event.detail))
      }
    }

    window.addEventListener('userUpdated', handleUserUpdate)

    // Rafraîchir le user quand l'onglet redevient visible (ex. après vérification email dans un autre onglet)
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      if (!localStorage.getItem('token')) return
      getMe().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // Sync quand un autre onglet met à jour le user (ex. /verify-email)
    const onStorage = (e) => {
      if (e.key !== 'user' || !e.newValue) return
      try {
        const next = JSON.parse(e.newValue)
        if (next && next.id) setUser(next)
      } catch (_) { /* ignore */ }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const response = await apiLogin(email, password)
      if (response.user && response.accessToken) {
        setUser(response.user)
        // Le token et user sont déjà stockés dans localStorage par api/auth.js
        return { success: true, user: response.user }
      }
      return { success: false, error: 'Email ou mot de passe incorrect' }
    } catch (error) {
      // Gérer les erreurs spécifiques du backend
      if (error.response?.data) {
        const errorData = error.response.data
        return {
          success: false,
          error: errorData.message || 'Erreur lors de la connexion',
          requiresAdminApproval: errorData.requiresAdminApproval || false,
          requiresEmailVerification: errorData.requiresEmailVerification || false,
        }
      }
      return { success: false, error: error.message || 'Erreur lors de la connexion' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}
