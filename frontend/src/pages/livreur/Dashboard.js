import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './LivreurDashboard.css';

const LivreurDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    toDeliver: 0,
    deliveredToday: 0,
    inTransit: 0
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders?status=LIVRAISON');
      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/orders/stats');
      if (response.data.success) {
        setStats({
          toDeliver: response.data.stats?.toDeliver || 0,
          deliveredToday: response.data.stats?.deliveredToday || 0,
          inTransit: response.data.stats?.inTransit || 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (response.data.success) {
        toast.success('Statut mis à jour avec succès');
        fetchOrders();
        fetchStats();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="livreur-dashboard">
      <h1>🚚 Tableau de Bord - Livreur</h1>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stats.toDeliver}</div>
            <div className="stat-label">À livrer</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.deliveredToday}</div>
            <div className="stat-label">Livrées aujourd'hui</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚛</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inTransit}</div>
            <div className="stat-label">En transit</div>
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="orders-section">
        <h2>Commandes à livrer</h2>
        {orders.length === 0 ? (
          <div className="no-orders">
            <p>Aucune commande à livrer</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>Commande #{order.id.slice(0, 8)}</h3>
                    <p className="order-date">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="order-details">
                  <p><strong>Magasin:</strong> {order.shop?.name}</p>
                  <p><strong>Adresse:</strong> {order.shop?.address}, {order.shop?.city}</p>
                  <p><strong>Total TTC:</strong> {order.totalTTC?.toFixed(2)} €</p>
                  <p><strong>Articles:</strong> {order.items?.length || 0}</p>
                </div>
                <div className="order-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => updateOrderStatus(order.id, 'LIVREE')}
                  >
                    Marquer comme livrée
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LivreurDashboard;
