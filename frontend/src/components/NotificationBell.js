import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './NotificationBell.css';

const NotificationBell = () => {
  const navigate = useNavigate();
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
      // Récupérer les nouvelles commandes (non lues)
      const response = await api.get('/admin/dashboard');
      
      // Vérifier si ordersByStatusToday existe dans la réponse
      if (response.data && response.data.ordersByStatusToday) {
        const newOrders = response.data.ordersByStatusToday.find(s => s.status === 'NEW');
        const count = newOrders?.count || 0;
        setUnreadCount(count);
        
        // Récupérer les détails des nouvelles commandes pour les afficher
        if (count > 0) {
          try {
            const ordersResponse = await api.get('/orders?status=NEW&limit=5');
            const newOrdersList = ordersResponse.data.orders || [];
            
            const notificationsList = newOrdersList.map((order) => ({
              id: order.id,
              message: `Nouvelle commande de ${order.shop?.name || 'Client'}`,
              type: 'order',
              read: false,
              createdAt: order.createdAt || new Date(),
              orderId: order.id,
              shopName: order.shop?.name || 'Client',
              total: order.totalTTC || 0
            }));
            
            setNotifications(notificationsList);
          } catch (ordersError) {
            console.error('Erreur récupération détails commandes:', ordersError);
            // Si erreur lors de la récupération des détails, créer une notification générique
            setNotifications([{
              id: 'new-orders',
              message: `${count} nouvelle${count > 1 ? 's' : ''} commande${count > 1 ? 's' : ''}`,
              type: 'order',
              read: false,
              createdAt: new Date()
            }]);
          }
        } else {
          setNotifications([]);
        }
      } else {
        // Fallback si la structure de données est différente
        setUnreadCount(0);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      setUnreadCount(0);
      setNotifications([]);
    }
  };

  const markAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notif) => {
    if (notif.orderId) {
      navigate('/admin/orders');
      setShowDropdown(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
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
                  className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notif)}
                  style={{ cursor: notif.orderId ? 'pointer' : 'default' }}
                >
                  <div className="notification-message">
                    {notif.message}
                    {notif.total > 0 && (
                      <span className="notification-price"> - {formatPrice(notif.total)}</span>
                    )}
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
                  navigate('/admin/orders?status=NEW');
                  setShowDropdown(false);
                }}
                className="notification-view-all"
              >
                Voir toutes les commandes
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

