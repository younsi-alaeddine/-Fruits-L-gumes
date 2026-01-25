import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getStores, getClientShops, getManagerShops } from '../api/stores'

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
    // Ne charger les magasins QUE si l'utilisateur est authentifié
    if (user) {
      loadStores()
    } else {
      // Réinitialiser si pas authentifié
      setStores([])
      setSelectedStoreId(null)
    }
  }, [user])

  const loadStores = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const isClient = user.role === 'CLIENT'
      const isManager = user.role === 'MANAGER'
      const fetchShops = isClient ? getClientShops : isManager ? getManagerShops : getStores
      const response = await fetchShops({ page: 1, limit: 200 })
      let list = response?.shops || []

      if (['MANAGER', 'PREPARATEUR', 'LIVREUR', 'COMMERCIAL', 'STOCK_MANAGER'].includes(user.role)) {
        const sid = user.storeId || localStorage.getItem('selectedStoreId')
        if (sid) {
          list = list.filter((s) => s && s.id === sid)
          if (list.length) setSelectedStoreId(sid)
        }
      }

      list = list.filter((s) => s && s.id && s.name)
      setStores(list)
      const saved = localStorage.getItem('selectedStoreId')
      if (saved && list.some((s) => s.id === saved)) {
        setSelectedStoreId(saved)
      } else if (list.length === 1 && !selectedStoreId) {
        setSelectedStoreId(list[0].id)
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
