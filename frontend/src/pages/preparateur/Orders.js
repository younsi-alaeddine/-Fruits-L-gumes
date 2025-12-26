import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './PreparateurOrders.css';

const PreparateurOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    date: ''
  });
  const [stats, setStats] = useState({
    newOrders: 0,
    inPreparation: 0,
    urgent: 0
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Récupérer les commandes NEW et PREPARATION
      if (filters.status) {
        params.append('status', filters.status);
      } else {
        // Par défaut, récupérer NEW et PREPARATION
        params.append('status', 'NEW,PREPARATION');
      }
      
      if (filters.date) {
        params.append('date', filters.date);
      }

      const response = await api.get(`/orders?${params.toString()}`);
      
      if (response.data.success) {
        let ordersList = response.data.orders || [];
        
        // Filtrer par priorité si nécessaire
        if (filters.priority === 'urgent') {
          ordersList = ordersList.filter(order => {
            const orderDate = new Date(order.deliveryDate || order.createdAt);
            const today = new Date();
            const diffDays = Math.ceil((orderDate - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 1;
          });
        }
        
        setOrders(ordersList);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/orders/stats');
      if (response.data.success) {
        setStats({
          newOrders: response.data.stats?.newOrders || 0,
          inPreparation: response.data.stats?.inPreparation || 0,
          urgent: 0 // Calculer les urgentes
        });
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getOrderPriority = (order) => {
    if (!order.deliveryDate) return 'normal';
    const deliveryDate = new Date(order.deliveryDate);
    const today = new Date();
    const diffDays = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'urgent';
    if (diffDays <= 1) return 'high';
    return 'normal';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && orders.length === 0) {
    return <div className="loading">Chargement des commandes...</div>;
  }

  return (
    <div className="preparateur-orders">
      <h1>📦 Commandes à Préparer</h1>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-new">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.newOrders}</div>
            <div className="stat-label">Nouvelles commandes</div>
          </div>
        </div>
        <div className="stat-card stat-preparation">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inPreparation}</div>
            <div className="stat-label">En préparation</div>
          </div>
        </div>
        <div className="stat-card stat-urgent">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <div className="stat-value">{stats.urgent}</div>
            <div className="stat-label">Urgentes</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-card">
        <h3>Filtres</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Statut</label>
            <select 
              name="status" 
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">Tous les statuts</option>
              <option value="NEW">Nouvelles</option>
              <option value="PREPARATION">En préparation</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priorité</label>
            <select 
              name="priority" 
              value={filters.priority}
              onChange={handleFilterChange}
            >
              <option value="">Toutes</option>
              <option value="urgent">Urgentes</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              name="date" 
              value={filters.date}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="orders-section">
        {orders.length === 0 ? (
          <div className="no-orders">
            <p>📭 Aucune commande à préparer</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const priority = getOrderPriority(order);
              return (
                <div 
                  key={order.id} 
                  className={`order-card priority-${priority}`}
                >
                  <div className="order-header">
                    <div className="order-info">
                      <h3>Commande #{order.id.slice(0, 8)}</h3>
                      <p className="order-date">
                        Créée le: {formatDate(order.createdAt)}
                      </p>
                      {order.deliveryDate && (
                        <p className="delivery-date">
                          Livraison prévue: {formatDate(order.deliveryDate)}
                        </p>
                      )}
                    </div>
                    <div className="order-status-badges">
                      <span className={`status-badge status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                      {priority === 'urgent' && (
                        <span className="priority-badge urgent">🚨 URGENT</span>
                      )}
                      {priority === 'high' && (
                        <span className="priority-badge high">⚠️ PRIORITAIRE</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="order-details">
                    <div className="detail-item">
                      <strong>Magasin:</strong> {order.shop?.name || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Ville:</strong> {order.shop?.city || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Total TTC:</strong> {formatPrice(order.totalTTC)}
                    </div>
                    <div className="detail-item">
                      <strong>Articles:</strong> {order.items?.length || 0} produit(s)
                    </div>
                    <div className="detail-item">
                      <strong>Quantité totale:</strong> {
                        order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
                      }
                    </div>
                  </div>

                  <div className="order-products-preview">
                    <strong>Produits:</strong>
                    <div className="products-list">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="product-tag">
                          {item.product?.name} x{item.quantity}
                        </span>
                      ))}
                      {order.items?.length > 3 && (
                        <span className="product-tag more">
                          +{order.items.length - 3} autre(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="order-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/preparateur/preparation/${order.id}`)}
                    >
                      📦 Préparer cette commande
                    </button>
                    {order.status === 'NEW' && (
                      <button
                        className="btn btn-secondary"
                        onClick={async () => {
                          try {
                            await api.patch(`/orders/${order.id}/status`, { 
                              status: 'PREPARATION' 
                            });
                            toast.success('Commande mise en préparation');
                            fetchOrders();
                            fetchStats();
                          } catch (error) {
                            toast.error('Erreur lors de la mise à jour');
                          }
                        }}
                      >
                        Commencer la préparation
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreparateurOrders;
