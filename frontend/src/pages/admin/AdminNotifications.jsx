import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications'

function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadNotifications() }, [])

  const loadNotifications = async () => {
    try {
      const res = await getNotifications()
      const adminNotifs = [
        { id: 1, type: 'order', title: 'Nouvelle commande', message: 'Commande #CMD-2026-050 reçue de Magasin Centre-Ville', isRead: false, createdAt: '2026-01-20T10:30:00Z', priority: 'high' },
        { id: 2, type: 'payment', title: 'Paiement reçu', message: 'Paiement de 789.50 € reçu pour INV-2026-002', isRead: false, createdAt: '2026-01-20T09:15:00Z', priority: 'medium' },
        { id: 3, type: 'system', title: 'Mise à jour système', message: 'Le système sera en maintenance demain 02h-04h', isRead: true, createdAt: '2026-01-19T16:45:00Z', priority: 'low' },
      ]
      setNotifications(adminNotifs)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    await markAsRead(id)
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const filteredNotifications = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications.filter(n => n.isRead)

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Notifications ADMIN</h1>
        <button onClick={() => markAllAsRead()} className="btn-secondary flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>Tout marquer comme lu</span>
        </button>
      </div>

      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-medium ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            Toutes ({notifications.length})
          </button>
          <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg font-medium ${filter === 'unread' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            Non lues ({notifications.filter(n => !n.isRead).length})
          </button>
        </div>

        <div className="space-y-4">
          {filteredNotifications.map((notif) => (
            <div key={notif.id} className={`border-2 rounded-xl p-4 ${notif.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="p-3 rounded-full bg-white text-primary-600">
                    <Bell className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{notif.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{notif.message}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(notif.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
                {!notif.isRead && <button onClick={() => handleMarkAsRead(notif.id)} className="btn-secondary text-sm">Marquer lu</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminNotifications
