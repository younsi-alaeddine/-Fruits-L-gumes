import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './StockAlerts.css';

const StockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    lowStock: 0,
    outOfStock: 0
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      if (response.data.success) {
        const products = response.data.products || [];
        const alertsList = products
          .filter(product => product.stock <= product.stockAlert)
          .map(product => ({
            ...product,
            alertType: product.stock <= 0 ? 'out' : 'low'
          }));
        
        setAlerts(alertsList);
        setStats({
          lowStock: alertsList.filter(a => a.alertType === 'low').length,
          outOfStock: alertsList.filter(a => a.alertType === 'out').length
        });
      }
    } catch (error) {
      console.error('Erreur chargement alertes:', error);
      toast.error('Erreur lors du chargement des alertes');
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId, quantity) => {
    try {
      await api.patch(`/products/${productId}/stock`, {
        quantity: parseFloat(quantity),
        reason: 'STOCK_REPLENISHMENT'
      });
      toast.success('Stock mis à jour');
      fetchAlerts();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="stock-alerts">
      <h1>🚨 Alertes de Stock</h1>

      <div className="stats-grid">
        <div className="stat-card stat-low">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.lowStock}</div>
            <div className="stat-label">Stock faible</div>
          </div>
        </div>
        <div className="stat-card stat-out">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <div className="stat-value">{stats.outOfStock}</div>
            <div className="stat-label">Rupture de stock</div>
          </div>
        </div>
      </div>

      <div className="alerts-section">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : alerts.length === 0 ? (
          <div className="no-alerts">
            <p>✅ Aucune alerte de stock</p>
          </div>
        ) : (
          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-card alert-${alert.alertType}`}>
                <div className="alert-header">
                  <h3>{alert.name}</h3>
                  <span className={`alert-badge alert-${alert.alertType}`}>
                    {alert.alertType === 'out' ? 'Rupture' : 'Stock faible'}
                  </span>
                </div>
                <div className="alert-details">
                  <p><strong>Stock actuel:</strong> {alert.stock} {alert.unit}</p>
                  <p><strong>Seuil d'alerte:</strong> {alert.stockAlert} {alert.unit}</p>
                  <p><strong>Catégorie:</strong> {alert.category}</p>
                </div>
                <div className="alert-actions">
                  <input
                    type="number"
                    placeholder="Quantité à ajouter"
                    className="replenish-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        updateStock(alert.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    className="btn-replenish"
                    onClick={(e) => {
                      const input = e.target.previousElementSibling;
                      updateStock(alert.id, input.value);
                      input.value = '';
                    }}
                  >
                    Réapprovisionner
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

export default StockAlerts;
