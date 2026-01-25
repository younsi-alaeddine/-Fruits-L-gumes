import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './LivreurStatistics.css';

const LivreurStatistics = () => {
  const [stats, setStats] = useState({
    today: { delivered: 0, km: 0, avgTime: 0 },
    week: { delivered: 0, km: 0, avgTime: 0 },
    month: { delivered: 0, km: 0, avgTime: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    fetchStatistics();
    fetchDeliveries();
  }, [period]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/deliveries');
      if (response.data.success) {
        const allDeliveries = response.data.deliveries || [];
        calculateStats(allDeliveries.filter(d => d.status === 'DELIVERED'));
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const response = await api.get('/deliveries?status=DELIVERED');
      if (response.data.success) {
        setDeliveries(response.data.deliveries || []);
      }
    } catch (error) {
      console.error('Erreur chargement livraisons:', error);
    }
  };

  const calculateStats = (deliveriesList) => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayDeliveries = deliveriesList.filter(d => 
      new Date(d.deliveredAt || d.updatedAt) >= today
    );
    const weekDeliveries = deliveriesList.filter(d => 
      new Date(d.deliveredAt || d.updatedAt) >= weekAgo
    );
    const monthDeliveries = deliveriesList.filter(d => 
      new Date(d.deliveredAt || d.updatedAt) >= monthAgo
    );

    setStats({
      today: {
        delivered: todayDeliveries.length,
        km: estimateKm(todayDeliveries),
        avgTime: calculateAvgTime(todayDeliveries)
      },
      week: {
        delivered: weekDeliveries.length,
        km: estimateKm(weekDeliveries),
        avgTime: calculateAvgTime(weekDeliveries)
      },
      month: {
        delivered: monthDeliveries.length,
        km: estimateKm(monthDeliveries),
        avgTime: calculateAvgTime(monthDeliveries)
      }
    });
  };

  const estimateKm = (deliveriesList) => {
    // Estimation basée sur le nombre de livraisons (moyenne de 10km par livraison)
    return deliveriesList.length * 10;
  };

  const calculateAvgTime = (deliveriesList) => {
    if (deliveriesList.length === 0) return 0;
    let totalMinutes = 0;
    deliveriesList.forEach(delivery => {
      if (delivery.deliveryDate && delivery.deliveredAt) {
        const start = new Date(delivery.deliveryDate);
        const end = new Date(delivery.deliveredAt);
        const diffMinutes = (end - start) / (1000 * 60);
        totalMinutes += diffMinutes;
      }
    });
    return deliveriesList.length > 0 ? Math.round(totalMinutes / deliveriesList.length) : 0;
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  const currentStats = stats[period] || stats.today;

  return (
    <div className="livreur-statistics">
      <h1>📊 Mes Statistiques</h1>

      <div className="period-selector">
        <button
          className={period === 'today' ? 'active' : ''}
          onClick={() => setPeriod('today')}
        >
          Aujourd'hui
        </button>
        <button
          className={period === 'week' ? 'active' : ''}
          onClick={() => setPeriod('week')}
        >
          Cette semaine
        </button>
        <button
          className={period === 'month' ? 'active' : ''}
          onClick={() => setPeriod('month')}
        >
          Ce mois
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{currentStats.delivered}</div>
            <div className="stat-label">Livraisons effectuées</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚗</div>
          <div className="stat-content">
            <div className="stat-value">{currentStats.km} km</div>
            <div className="stat-label">Kilomètres parcourus</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{formatTime(currentStats.avgTime)}</div>
            <div className="stat-label">Temps moyen</div>
          </div>
        </div>
      </div>

      <div className="recent-deliveries-section">
        <h2>Livraisons récentes</h2>
        <div className="deliveries-list">
          {loading ? (
            <div className="loading">Chargement...</div>
          ) : deliveries.length === 0 ? (
            <div className="no-deliveries">Aucune livraison effectuée</div>
          ) : (
            deliveries.slice(0, 10).map(delivery => (
              <div key={delivery.id} className="delivery-item">
                <div className="delivery-info">
                  <strong>Livraison #{delivery.id.slice(0, 8)}</strong>
                  <span>{delivery.order?.shop?.name || 'N/A'}</span>
                </div>
                <div className="delivery-date">
                  {new Date(delivery.deliveredAt || delivery.updatedAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LivreurStatistics;
