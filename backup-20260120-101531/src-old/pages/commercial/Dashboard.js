import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './CommercialDashboard.css';

const CommercialDashboard = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalSales: 0
  });

  useEffect(() => {
    fetchShops();
    fetchStats();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops');
      if (response.data.success) {
        setShops(response.data.shops || []);
      }
    } catch (error) {
      console.error('Erreur chargement magasins:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/shops/stats');
      if (response.data.success) {
        setStats({
          totalClients: response.data.stats?.total || 0,
          activeClients: response.data.stats?.active || 0,
          totalSales: response.data.stats?.totalSales || 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="commercial-dashboard">
      <h1>💼 Tableau de Bord - Commercial</h1>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalClients}</div>
            <div className="stat-label">Total clients</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeClients}</div>
            <div className="stat-label">Clients actifs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalSales?.toFixed(2)} €</div>
            <div className="stat-label">Chiffre d'affaires</div>
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="shops-section">
        <h2>Liste des clients</h2>
        {shops.length === 0 ? (
          <div className="no-shops">
            <p>Aucun client enregistré</p>
          </div>
        ) : (
          <div className="shops-list">
            {shops.map((shop) => (
              <div key={shop.id} className="shop-card">
                <div className="shop-header">
                  <h3>{shop.name}</h3>
                  <span className="shop-status">Actif</span>
                </div>
                <div className="shop-details">
                  <p><strong>Adresse:</strong> {shop.address}</p>
                  <p><strong>Ville:</strong> {shop.city} {shop.postalCode}</p>
                  {shop.phone && <p><strong>Téléphone:</strong> {shop.phone}</p>}
                  {shop.user && <p><strong>Contact:</strong> {shop.user.name} ({shop.user.email})</p>}
                </div>
                <div className="shop-actions">
                  <Link to={`/commercial/shops/${shop.id}`} className="btn btn-primary">
                    Voir détails
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommercialDashboard;
