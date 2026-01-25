import React, { useState, useEffect, useCallback } from 'react'
import { Bell, X, Package, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import {
  getNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
} from '../api/notifications'

const TYPE_ICON = {
  ORDER_NEW: Package,
  ORDER_STATUS_CHANGED: Clock,
  ORDER_READY: CheckCircle,
  ORDER_DELIVERED: CheckCircle,
  PAYMENT_RECEIVED: CheckCircle,
  STOCK_LOW: AlertTriangle,
  STOCK_OUT: AlertTriangle,
  SYSTEM_ALERT: Bell,
}
const TYPE_COLOR = {
  ORDER_NEW: 'from-blue-50 to-blue-100 border-blue-200 text-blue-800',
  ORDER_STATUS_CHANGED: 'from-blue-50 to-blue-100 border-blue-200 text-blue-800',
  ORDER_READY: 'from-green-50 to-green-100 border-green-200 text-green-800',
  ORDER_DELIVERED: 'from-green-50 to-green-100 border-green-200 text-green-800',
  PAYMENT_RECEIVED: 'from-green-50 to-green-100 border-green-200 text-green-800',
  STOCK_LOW: 'from-orange-50 to-orange-100 border-orange-200 text-orange-800',
  STOCK_OUT: 'from-red-50 to-red-100 border-red-200 text-red-800',
  SYSTEM_ALERT: 'from-amber-50 to-amber-100 border-amber-200 text-amber-800',
}

function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [listRes, countRes] = await Promise.all([
        getNotifications({ limit: 20 }),
        getUnreadCount(),
      ])
      setNotifications(listRes?.notifications ?? [])
      setUnreadCount(countRes?.count ?? 0)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    if (showPanel) load()
  }, [showPanel, load])

  const markAsRead = async (id) => {
    try {
      await apiMarkAsRead(id)
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllAsRead = async () => {
    try {
      await apiMarkAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }

  const deleteNotification = async (id) => {
    const notif = notifications.find(n => n.id === id)
    try {
      await apiDeleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (notif && !notif.read) setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const getTypeColor = (type) => TYPE_COLOR[type] || 'from-gray-50 to-gray-100 border-gray-200 text-gray-800'
  const getIcon = (type) => TYPE_ICON[type] || Bell

  return (
    <div className="relative">
      {/* Bell Icon with badge */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                  >
                    Tout lire
                  </button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  className="hover:bg-white/20 p-1 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = notif.icon
                return (
                  <div
                    key={notif.id}
                    className={`mb-2 p-3 rounded-lg border-2 bg-gradient-to-r ${getTypeColor(notif.type)} ${
                      notif.read ? 'opacity-60' : ''
                    } hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm mb-1">{notif.title}</h4>
                        <p className="text-xs mb-2">{notif.message}</p>
                        <p className="text-xs opacity-70">
                          {new Date(notif.timestamp).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-xs hover:underline"
                            title="Marquer comme lu"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-xs hover:underline text-red-600"
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter
