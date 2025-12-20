import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './AdminNotifications.css';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, read, unread
  const [typeFilter, setTypeFilter] = useState('all');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  useEffect(() => {
    fetchNotifications();
  }, [filter, typeFilter, pagination.page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        read: filter === 'all' ? undefined : filter === 'read',
        type: typeFilter !== 'all' ? typeFilter : undefined,
      };

      const response = await api.get('/notifications', { params });
      setNotifications(response.data.notifications || []);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination,
      }));
    } catch (error) {
      toast.error('Erreur lors du chargement des notifications');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true, readAt: new Date() } : n))
      );
      toast.success('Notification marquée comme lue');
    } catch (error) {
      toast.error('Erreur lors du marquage');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date() })));
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      toast.error('Erreur lors du marquage');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette notification ?')) return;

    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      ORDER_NEW: '🆕',
      ORDER_STATUS_CHANGED: '🔄',
      PAYMENT_RECEIVED: '💰',
      STOCK_LOW: '⚠️',
      STOCK_OUT: '🚨',
      ORDER_READY: '✅',
      ORDER_DELIVERED: '📦',
      SYSTEM_ALERT: '🔔',
    };
    return icons[type] || '📢';
  };

  const getTypeLabel = (type) => {
    const labels = {
      ORDER_NEW: 'Nouvelle commande',
      ORDER_STATUS_CHANGED: 'Statut modifié',
      PAYMENT_RECEIVED: 'Paiement reçu',
      STOCK_LOW: 'Stock faible',
      STOCK_OUT: 'Stock épuisé',
      ORDER_READY: 'Commande prête',
      ORDER_DELIVERED: 'Commande livrée',
      SYSTEM_ALERT: 'Alerte système',
    };
    return labels[type] || type;
  };

  return (
    <div className="admin-notifications">
      <div className="notifications-header">
        <h1>🔔 Notifications</h1>
        <div className="notifications-actions">
          <button className="btn btn-secondary" onClick={handleMarkAllAsRead}>
            Tout marquer comme lu
          </button>
        </div>
      </div>

      <div className="notifications-filters">
        <div className="filter-group">
          <label>Filtre de lecture :</label>
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}>
            <option value="all">Toutes</option>
            <option value="unread">Non lues</option>
            <option value="read">Lues</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type :</label>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}>
            <option value="all">Tous les types</option>
            <option value="ORDER_NEW">Nouvelles commandes</option>
            <option value="ORDER_STATUS_CHANGED">Changements de statut</option>
            <option value="PAYMENT_RECEIVED">Paiements</option>
            <option value="STOCK_LOW">Stock faible</option>
            <option value="STOCK_OUT">Stock épuisé</option>
            <option value="ORDER_READY">Commandes prêtes</option>
            <option value="ORDER_DELIVERED">Commandes livrées</option>
            <option value="SYSTEM_ALERT">Alertes système</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <p>Aucune notification</p>
        </div>
      ) : (
        <>
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                <div className="notification-icon">{getTypeIcon(notification.type)}</div>
                <div className="notification-content">
                  <div className="notification-header-item">
                    <span className="notification-type">{getTypeLabel(notification.type)}</span>
                    <span className="notification-date">
                      {format(new Date(notification.createdAt), 'PPpp', { locale: fr })}
                    </span>
                  </div>
                  <h3 className="notification-title">{notification.title}</h3>
                  <p className="notification-message">{notification.message}</p>
                </div>
                <div className="notification-actions">
                  {!notification.read && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Marquer comme lu
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(notification.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Précédent
              </button>
              <span>
                Page {pagination.page} sur {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminNotifications;
