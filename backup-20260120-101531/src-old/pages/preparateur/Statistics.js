import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './PreparateurStatistics.css';

const PreparateurStatistics = () => {
  const [stats, setStats] = useState({
    today: { count: 0, avgTime: 0 },
    week: { count: 0, avgTime: 0 },
    month: { count: 0, avgTime: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today'); // today, week, month
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchStatistics();
    fetchOrders();
  }, [period]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders?status=LIVRAISON,LIVREE');
      if (response.data.success) {
        const allOrders = response.data.orders || [];
        calculateStats(allOrders);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders?status=LIVREE');
      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    }
  };

  const calculateStats = (ordersList) => {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayOrders = ordersList.filter(order => 
      new Date(order.updatedAt) >= today && order.status === 'LIVREE'
    );
    const weekOrders = ordersList.filter(order => 
      new Date(order.updatedAt) >= weekAgo && order.status === 'LIVREE'
    );
    const monthOrders = ordersList.filter(order => 
      new Date(order.updatedAt) >= monthAgo && order.status === 'LIVREE'
    );

    setStats({
      today: {
        count: todayOrders.length,
        avgTime: calculateAvgTime(todayOrders)
      },
      week: {
        count: weekOrders.length,
        avgTime: calculateAvgTime(weekOrders)
      },
      month: {
        count: monthOrders.length,
        avgTime: calculateAvgTime(monthOrders)
      }
    });
  };

  const calculateAvgTime = (ordersList) => {
    if (ordersList.length === 0) return 0;
    let totalMinutes = 0;
    ordersList.forEach(order => {
      if (order.createdAt && order.updatedAt) {
        const created = new Date(order.createdAt);
        const updated = new Date(order.updatedAt);
        const diffMinutes = (updated - created) / (1000 * 60);
        totalMinutes += diffMinutes;
      }
    });
    return Math.round(totalMinutes / ordersList.length);
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
  };

  const currentStats = stats[period] || stats.today;

  return (
    <div className="preparateur-statistics">
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
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{currentStats.count}</div>
            <div className="stat-label">Commandes préparées</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">{formatTime(currentStats.avgTime)}</div>
            <div className="stat-label">Temps moyen</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">
              {period === 'today' ? stats.week.count : stats.month.count}
            </div>
            <div className="stat-label">
              {period === 'today' ? 'Cette semaine' : 'Ce mois'}
            </div>
          </div>
        </div>
      </div>

      <div className="recent-orders-section">
        <h2>Commandes récentes préparées</h2>
        <div className="orders-list">
          {loading ? (
            <div className="loading">Chargement...</div>
          ) : orders.length === 0 ? (
            <div className="no-orders">Aucune commande préparée</div>
          ) : (
            orders.slice(0, 10).map(order => (
              <div key={order.id} className="order-item">
                <div className="order-info">
                  <strong>Commande #{order.id.slice(0, 8)}</strong>
                  <span>{order.shop?.name || 'N/A'}</span>
                </div>
                <div className="order-date">
                  {new Date(order.updatedAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PreparateurStatistics;
