import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './NotificationBell.css';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      // Utiliser la nouvelle API de notifications
      const response = await api.get('/notifications/unread-count');
      const count = response.data.count || 0;
      setUnreadCount(count);
      
      // Récupérer les dernières notifications
      if (count > 0) {
        try {
          const notifsResponse = await api.get('/notifications', {
            params: { limit: 5, read: false }
          });
          setNotifications(notifsResponse.data.notifications || []);
        } catch (notifError) {
          console.error('Erreur récupération notifications:', notifError);
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Erreur récupération nombre notifications:', error);
      setUnreadCount(0);
      setNotifications([]);
    }
  };

  const markAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur marquage notifications:', error);
    }
  };

  const handleNotificationClick = (notif) => {
    // Navigation basée sur le type de notification
    const role = user?.role || 'CLIENT';
    if (notif.data) {
      try {
        const data = JSON.parse(notif.data);
        if (data.orderId) {
          navigate(role === 'ADMIN' ? '/admin/orders' : '/client/orders');
        }
      } catch (e) {
        // Si pas de données JSON, naviguer vers les notifications
        navigate(role === 'ADMIN' ? '/admin/notifications' : '/client/notifications');
      }
    } else {
      navigate(role === 'ADMIN' ? '/admin/notifications' : '/client/notifications');
    }
    setShowDropdown(false);
  };

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.notification-bell')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  return (
    <div className="notification-bell">
      <button
        className="bell-button"
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown && unreadCount > 0) {
            markAsRead();
          }
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
      
      {showDropdown && (
        <>
          <div className="notification-overlay" onClick={() => setShowDropdown(false)}></div>
          <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
            <button onClick={() => setShowDropdown(false)}>×</button>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">Aucune nouvelle notification</div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                  style={{ cursor: 'pointer' }}
                >
                  {notif.title && (
                    <div className="notification-title">{notif.title}</div>
                  )}
                  <div className="notification-message">
                    {notif.message}
                  </div>
                  <div className="notification-time">
                    {new Date(notif.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
            {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                onClick={() => {
                  const role = user?.role || 'CLIENT';
                  navigate(role === 'ADMIN' ? '/admin/notifications' : '/client/notifications');
                  setShowDropdown(false);
                }}
                className="notification-view-all"
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
