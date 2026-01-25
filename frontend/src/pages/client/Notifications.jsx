import React, { useState, useEffect } from 'react'
import { Bell, CheckCircle, AlertCircle, Truck, Package, Clock } from 'lucide-react'
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadNotifications() }, [])

  const loadNotifications = async () => {
    try {
      const res = await getNotifications()
      setNotifications(res.data || [])
    } catch (error) {
      console.error(error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    await markAsRead(id)
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
  }

  const filteredNotifications = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications.filter(n => n.isRead)

  const getIcon = (type) => {
    const icons = {
      order: CheckCircle,
      stock: AlertCircle,
      delivery: Truck,
      payment: Package,
    }
    const Icon = icons[type] || Bell
    return <Icon className="h-6 w-6" />
  }

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-50 border-red-200',
      medium: 'bg-yellow-50 border-yellow-200',
      low: 'bg-blue-50 border-blue-200',
    }
    return colors[priority] || 'bg-gray-50 border-gray-200'
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Notifications</h1>
        <button onClick={handleMarkAllAsRead} className="btn-secondary flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>Tout marquer comme lu</span>
        </button>
      </div>

      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-medium ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Toutes ({notifications.length})
          </button>
          <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg font-medium ${filter === 'unread' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Non lues ({notifications.filter(n => !n.isRead).length})
          </button>
          <button onClick={() => setFilter('read')} className={`px-4 py-2 rounded-lg font-medium ${filter === 'read' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Lues ({notifications.filter(n => n.isRead).length})
          </button>
        </div>

        <div className="space-y-4">
          {filteredNotifications.map((notif) => (
            <div key={notif.id} className={`border-2 rounded-xl p-4 transition-all ${notif.isRead ? 'bg-white border-gray-200' : getPriorityColor(notif.priority)} hover:shadow-md`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`p-3 rounded-full ${notif.isRead ? 'bg-gray-100 text-gray-600' : 'bg-white text-primary-600'}`}>
                    {getIcon(notif.type)}
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
                {!notif.isRead && (
                  <button onClick={() => handleMarkAsRead(notif.id)} className="btn-secondary text-sm">
                    Marquer lu
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Notifications
