import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

/**
 * Contexte d'authentification
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Charger l'utilisateur depuis localStorage au démarrage
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }

    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      // Mock login - à remplacer par un vrai appel API
      const mockUsers = {
        'admin@example.com': { id: '1', email: 'admin@example.com', role: 'ADMIN', firstName: 'Admin', lastName: 'User' },
        'client@example.com': { id: '2', email: 'client@example.com', role: 'CLIENT', clientId: 'client-1', firstName: 'Client', lastName: 'User' },
        'manager@example.com': { id: '3', email: 'manager@example.com', role: 'MANAGER', storeId: 'store-1', firstName: 'Manager', lastName: 'User' },
      }

      const foundUser = mockUsers[email]
      if (foundUser && password === 'password') {
        const token = 'mock-token-' + Date.now()
        setUser(foundUser)
        localStorage.setItem('user', JSON.stringify(foundUser))
        localStorage.setItem('token', token)
        return { success: true, user: foundUser }
      }

      return { success: false, error: 'Email ou mot de passe incorrect' }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      return { success: false, error: 'Erreur lors de la connexion' }
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
