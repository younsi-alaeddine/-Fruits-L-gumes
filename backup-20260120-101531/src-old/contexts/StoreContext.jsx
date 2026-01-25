import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getStores } from '../api/stores'

const StoreContext = createContext(null)

/**
 * Contexte de gestion des magasins
 */
export function StoreProvider({ children }) {
  const { user } = useAuth()
  const [stores, setStores] = useState([])
  const [selectedStoreId, setSelectedStoreId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStores()
  }, [user])

  const loadStores = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getStores()
      let filteredStores = response.data || []

      // Filtrer selon le rôle de l'utilisateur
      if (user) {
        if (user.role === 'CLIENT' && user.clientId) {
          filteredStores = filteredStores.filter((s) => s && s.clientId === user.clientId)
        } else if (user.storeId && ['MANAGER', 'PREPARATEUR', 'LIVREUR', 'COMMERCIAL', 'STOCK_MANAGER'].includes(user.role)) {
          filteredStores = filteredStores.filter((s) => s && s.id === user.storeId)
          if (filteredStores.length > 0) {
            setSelectedStoreId(user.storeId)
          }
        }
      }

      // Filtrer les magasins valides
      filteredStores = filteredStores.filter((s) => s && s.id && s.name)
      setStores(filteredStores)

      // Si un seul magasin disponible, le sélectionner automatiquement
      if (filteredStores.length === 1 && !selectedStoreId) {
        setSelectedStoreId(filteredStores[0].id)
      }
    } catch (error) {
      console.error('Erreur de chargement des magasins:', error)
    } finally {
      setLoading(false)
    }
  }, [user, selectedStoreId])

  const selectStore = useCallback((storeId) => {
    setSelectedStoreId(storeId)
    localStorage.setItem('selectedStoreId', storeId)
  }, [])

  const activeStore = stores.find((s) => s.id === selectedStoreId) || stores[0] || null

  const value = {
    stores,
    selectedStoreId,
    activeStore,
    loading,
    selectStore,
    loadStores,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore doit être utilisé dans un StoreProvider')
  }
  return context
}
