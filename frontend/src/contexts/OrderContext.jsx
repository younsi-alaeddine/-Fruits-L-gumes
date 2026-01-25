import React, { createContext, useContext, useState } from 'react'

const OrderContext = createContext(null)

/**
 * Contexte de gestion des commandes
 */
export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  const value = {
    orders,
    setOrders,
    loading,
    setLoading,
  }

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrder doit être utilisé dans un OrderProvider')
  }
  return context
}
