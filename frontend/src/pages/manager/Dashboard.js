import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeClients: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const dashboardResponse = await api.get('/admin/dashboard');
      if (dashboardResponse.data.success) {
        setStats({
          totalOrders: dashboardResponse.data.dashboard?.totalOrders || 0,
          totalRevenue: dashboardResponse.data.dashboard?.totalRevenue || 0,
          activeClients: dashboardResponse.data.dashboard?.activeClients || 0,
          pendingOrders: dashboardResponse.data.dashboard?.pendingOrders || 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price || 0);
  };

  return (
    <div className="manager-dashboard">
      <h1>👔 Tableau de Bord - Manager</h1>

      {/* Statistiques globales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Total commandes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{formatPrice(stats.totalRevenue)}</div>
            <div className="stat-label">Chiffre d'affaires</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeClients}</div>
            <div className="stat-label">Clients actifs</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingOrders}</div>
            <div className="stat-label">Commandes en attente</div>
          </div>
        </div>
      </div>

      {/* Accès rapides */}
      <div className="quick-access-section">
        <h2>Accès rapides</h2>
        <div className="quick-access-grid">
          <Link to="/admin/orders" className="quick-access-card">
            <div className="quick-access-icon">📋</div>
            <div className="quick-access-title">Commandes</div>
            <div className="quick-access-desc">Gérer les commandes</div>
          </Link>
          <Link to="/admin/products" className="quick-access-card">
            <div className="quick-access-icon">🛍️</div>
            <div className="quick-access-title">Produits</div>
            <div className="quick-access-desc">Gérer le catalogue</div>
          </Link>
          <Link to="/admin/users" className="quick-access-card">
            <div className="quick-access-icon">👥</div>
            <div className="quick-access-title">Utilisateurs</div>
            <div className="quick-access-desc">Gérer les utilisateurs</div>
          </Link>
          <Link to="/admin/payments" className="quick-access-card">
            <div className="quick-access-icon">💳</div>
            <div className="quick-access-title">Paiements</div>
            <div className="quick-access-desc">Gérer les paiements</div>
          </Link>
          <Link to="/admin/stock" className="quick-access-card">
            <div className="quick-access-icon">📦</div>
            <div className="quick-access-title">Stock</div>
            <div className="quick-access-desc">Gérer les stocks</div>
          </Link>
          <Link to="/admin/shops" className="quick-access-card">
            <div className="quick-access-icon">🏪</div>
            <div className="quick-access-title">Magasins</div>
            <div className="quick-access-desc">Gérer les magasins</div>
          </Link>
        </div>
      </div>

      {/* Rôles et équipes */}
      <div className="roles-section">
        <h2>Gestion des équipes</h2>
        <div className="roles-grid">
          <div className="role-card">
            <h3>📦 Préparation</h3>
            <p>Gérer les commandes en préparation</p>
            <Link to="/preparateur" className="btn btn-secondary">Accéder</Link>
          </div>
          <div className="role-card">
            <h3>🚚 Livraison</h3>
            <p>Gérer les livraisons</p>
            <Link to="/livreur" className="btn btn-secondary">Accéder</Link>
          </div>
          <div className="role-card">
            <h3>💼 Commercial</h3>
            <p>Gérer les clients et ventes</p>
            <Link to="/commercial" className="btn btn-secondary">Accéder</Link>
          </div>
          <div className="role-card">
            <h3>📊 Stock</h3>
            <p>Gérer les stocks</p>
            <Link to="/stock" className="btn btn-secondary">Accéder</Link>
          </div>
          <div className="role-card">
            <h3>💰 Finance</h3>
            <p>Gérer les paiements</p>
            <Link to="/finance" className="btn btn-secondary">Accéder</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
