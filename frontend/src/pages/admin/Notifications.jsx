import React, { useState, useEffect, useRef } from 'react'
import {
  Bell, Check, CheckCheck, Trash2, X, Clock, AlertCircle,
  ShoppingCart, CreditCard, Package, Truck, TrendingDown
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications
} from '../../api/notifications'
import { initSocket, disconnectSocket, getSocket } from '../../utils/socket'
import { getToken } from '../../utils/auth'

function Notifications() {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast()
  
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    read: '',
    type: '',
    page: 1,
    limit: 50
  })
  const socketRef = useRef(null)

  useEffect(() => {
    loadData()
    
    // Initialiser Socket.io
    const token = getToken()
    if (token) {
      socketRef.current = initSocket(token)
      
      socketRef.current.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
        showSuccess(`Nouvelle notification: ${notification.title}`)
      })
    }

    return () => {
      if (socketRef.current) {
        disconnectSocket()
      }
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      const [notifsData, countData] = await Promise.all([
        getNotifications(filters),
        getUnreadCount()
      ])
      setNotifications(notifsData.notifications || [])
      setUnreadCount(countData.count || 0)
    } catch (error) {
      showError('Erreur lors du chargement')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id)
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true, readAt: new Date() } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
      showSuccess('Notification marquée comme lue')
    } catch (error) {
      showError('Erreur lors du marquage')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date() })))
      setUnreadCount(0)
      showSuccess('Toutes les notifications ont été marquées comme lues')
    } catch (error) {
      showError('Erreur lors du marquage')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      showSuccess('Notification supprimée')
    } catch (error) {
      showError('Erreur lors de la suppression')
    }
  }

  const handleDeleteRead = async () => {
    try {
      await deleteReadNotifications()
      setNotifications(prev => prev.filter(n => !n.read))
      showSuccess('Notifications lues supprimées')
    } catch (error) {
      showError('Erreur lors de la suppression')
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      ORDER_NEW: ShoppingCart,
      ORDER_STATUS_CHANGED: Package,
      PAYMENT_RECEIVED: CreditCard,
      STOCK_LOW: TrendingDown,
      STOCK_OUT: AlertCircle,
      ORDER_READY: Package,
      ORDER_DELIVERED: Truck,
      SYSTEM_ALERT: AlertCircle
    }
    return icons[type] || Bell
  }

  const getTypeColor = (type) => {
    const colors = {
      ORDER_NEW: 'text-blue-600 bg-blue-100',
      ORDER_STATUS_CHANGED: 'text-purple-600 bg-purple-100',
      PAYMENT_RECEIVED: 'text-green-600 bg-green-100',
      STOCK_LOW: 'text-orange-600 bg-orange-100',
      STOCK_OUT: 'text-red-600 bg-red-100',
      ORDER_READY: 'text-indigo-600 bg-indigo-100',
      ORDER_DELIVERED: 'text-teal-600 bg-teal-100',
      SYSTEM_ALERT: 'text-red-600 bg-red-100'
    }
    return colors[type] || 'text-gray-600 bg-gray-100'
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} hideToast={hideToast} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-900 to-red-600 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-gray-600 mt-2">
            {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes les notifications sont lues'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Tout marquer comme lu
            </button>
          )}
          <button
            onClick={handleDeleteRead}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer les lues
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filters.read}
            onChange={(e) => setFilters({ ...filters, read: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">Toutes</option>
            <option value="false">Non lues</option>
            <option value="true">Lues</option>
          </select>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tous les types</option>
            <option value="ORDER_NEW">Nouvelle commande</option>
            <option value="ORDER_STATUS_CHANGED">Statut commande</option>
            <option value="PAYMENT_RECEIVED">Paiement reçu</option>
            <option value="STOCK_LOW">Stock faible</option>
            <option value="STOCK_OUT">Rupture de stock</option>
            <option value="ORDER_READY">Commande prête</option>
            <option value="ORDER_DELIVERED">Commande livrée</option>
            <option value="SYSTEM_ALERT">Alerte système</option>
          </select>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="space-y-3">
        {notifications.map((notification) => {
          const Icon = getTypeIcon(notification.type)
          const isUnread = !notification.read
          
          return (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                isUnread
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getTypeColor(notification.type)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(notification.createdAt).toLocaleString('fr-FR')}
                          </span>
                          {notification.readAt && (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Lu le {new Date(notification.readAt).toLocaleString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Marquer comme lu"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {notifications.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Aucune notification</p>
        </div>
      )}
    </div>
  )
}

export default Notifications
