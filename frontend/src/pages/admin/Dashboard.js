import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalsByShop, setTotalsByShop] = useState([]);
  const [period, setPeriod] = useState('today');
  const [salesEvolution, setSalesEvolution] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('month');

  useEffect(() => {
    fetchDashboard();
    fetchTotalsByShop();
    fetchSalesEvolution();
    fetchTopProducts();
    fetchCategoryDistribution();
  }, []);

  useEffect(() => {
    fetchTotalsByShop();
  }, [period]);

  useEffect(() => {
    fetchSalesEvolution();
    fetchTopProducts();
    fetchCategoryDistribution();
  }, [chartPeriod]);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setDashboard(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalsByShop = async () => {
    try {
      const response = await api.get(`/admin/totals-by-shop?period=${period}`);
      setTotalsByShop(response.data.totals);
    } catch (error) {
      console.error('Erreur chargement totaux par magasin:', error);
    }
  };

  const fetchSalesEvolution = async () => {
    try {
      const days = chartPeriod === 'week' ? 7 : chartPeriod === 'month' ? 30 : 365;
      const response = await api.get(`/admin/stats/sales-evolution?days=${days}`);
      setSalesEvolution(response.data.evolution);
    } catch (error) {
      console.error('Erreur chargement évolution ventes:', error);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const response = await api.get(`/admin/stats/top-products?limit=10&period=${chartPeriod}`);
      setTopProducts(response.data.topProducts);
    } catch (error) {
      console.error('Erreur chargement top produits:', error);
    }
  };

  const fetchCategoryDistribution = async () => {
    try {
      const response = await api.get(`/admin/stats/category-distribution?period=${chartPeriod}`);
      setCategoryDistribution(response.data.distribution);
    } catch (error) {
      console.error('Erreur chargement répartition catégories:', error);
    }
  };

  const exportStatisticsToExcel = async () => {
    try {
      const response = await api.get(`/admin/export/statistics?period=${period}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statistiques_${period}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Export Excel réussi');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const exportTotalsToCSV = () => {
    if (totalsByShop.length === 0) {
      toast.warning('Aucune donnée à exporter');
      return;
    }

    const headers = ['Magasin', 'Ville', 'Nb commandes', 'Total HT', 'Total TVA', 'Total TTC'];
    const csvData = totalsByShop.map(shop => [
      shop.shopName,
      shop.shopCity,
      shop.orderCount,
      formatPrice(shop.totalHT).replace('€', '').trim(),
      formatPrice(shop.totalTVA).replace('€', '').trim(),
      formatPrice(shop.totalTTC).replace('€', '').trim()
    ]);

    const csvContent = [
      headers.join(';'),
      ...csvData.map(row => row.join(';'))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `totaux_magasins_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export CSV réussi');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getStatusLabel = (status) => {
    const labels = {
      NEW: 'Nouvelle',
      PREPARATION: 'En préparation',
      LIVRAISON: 'En livraison',
      LIVREE: 'Livrée',
      ANNULEE: 'Annulée'
    };
    return labels[status] || status;
  };

  const getStatusCount = (status) => {
    if (!dashboard?.ordersByStatusToday) return 0;
    const statusData = dashboard.ordersByStatusToday.find(s => s.status === status);
    return statusData?.count || 0;
  };

  if (loading) {
    return <div className="loading">Chargement du dashboard...</div>;
  }

  if (!dashboard) {
    return <div>Aucune donnée disponible</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>📊 Tableau de Bord</h1>

      {/* Vue globale - Statistiques du jour */}
      <div className="dashboard-overview">
        <div className="overview-card main-card">
          <div className="overview-header">
            <h2>📅 Aujourd'hui</h2>
            <span className="date-badge">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <div className="overview-stats">
            <div className="stat-primary">
              <div className="stat-label">Commandes aujourd'hui</div>
              <div className="stat-value-large">{dashboard.today.orderCount}</div>
            </div>
            <div className="stat-primary">
              <div className="stat-label">Total général</div>
              <div className="stat-value-large">{formatPrice(dashboard.today.totalTTC)}</div>
            </div>
          </div>
        </div>

        {/* Commandes par statut */}
        <div className="status-overview">
          <h3>Commandes par statut</h3>
          <div className="status-grid">
            <div className="status-card status-new">
              <div className="status-icon">🆕</div>
              <div className="status-info">
                <div className="status-name">Nouvelles</div>
                <div className="status-count">{getStatusCount('NEW')}</div>
              </div>
            </div>
            <div className="status-card status-preparation">
              <div className="status-icon">⏳</div>
              <div className="status-info">
                <div className="status-name">En préparation</div>
                <div className="status-count">{getStatusCount('PREPARATION')}</div>
              </div>
            </div>
            <div className="status-card status-livraison">
              <div className="status-icon">🚚</div>
              <div className="status-info">
                <div className="status-name">En livraison</div>
                <div className="status-count">{getStatusCount('LIVRAISON')}</div>
              </div>
            </div>
            <div className="status-card status-livree">
              <div className="status-icon">✅</div>
              <div className="status-info">
                <div className="status-name">Livrées</div>
                <div className="status-count">{getStatusCount('LIVREE')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Totaux par magasin */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>💰 Totaux par magasin</h2>
          <div className="section-header-actions">
            <button
              onClick={exportTotalsToCSV}
              className="btn btn-success btn-sm"
              disabled={totalsByShop.length === 0}
            >
              📥 Exporter CSV
            </button>
            <button
              onClick={exportStatisticsToExcel}
              className="btn btn-success btn-sm"
              disabled={totalsByShop.length === 0}
            >
              📊 Exporter Excel
            </button>
            <div className="period-filters">
            <button
              className={`period-btn ${period === 'today' ? 'active' : ''}`}
              onClick={() => setPeriod('today')}
            >
              Aujourd'hui
            </button>
            <button
              className={`period-btn ${period === 'week' ? 'active' : ''}`}
              onClick={() => setPeriod('week')}
            >
              Cette semaine
            </button>
            <button
              className={`period-btn ${period === 'month' ? 'active' : ''}`}
              onClick={() => setPeriod('month')}
            >
              Ce mois
            </button>
            </div>
          </div>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Magasin</th>
                <th>Nb commandes</th>
                <th>Total HT</th>
                <th>Total TVA</th>
                <th>Total TTC</th>
              </tr>
            </thead>
            <tbody>
              {totalsByShop.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">Aucune donnée pour cette période</td>
                </tr>
              ) : (
                totalsByShop.map((shop) => (
                  <tr key={shop.shopId}>
                    <td><strong>{shop.shopName}</strong><br /><small>{shop.shopCity}</small></td>
                    <td>{shop.orderCount}</td>
                    <td>{formatPrice(shop.totalHT)}</td>
                    <td>{formatPrice(shop.totalTVA)}</td>
                    <td className="price-cell"><strong>{formatPrice(shop.totalTTC)}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistiques du mois */}
      <div className="stats-grid">
        <div className="stat-card stat-month">
          <h3>📊 Ce mois</h3>
          <div className="stat-value">{formatPrice(dashboard.month.totalTTC)}</div>
          <div className="stat-label">
            {dashboard.month.orderCount} commande{dashboard.month.orderCount > 1 ? 's' : ''}
          </div>
          <div className="stat-details">
            <span>HT: {formatPrice(dashboard.month.totalHT)}</span>
            <span>TVA: {formatPrice(dashboard.month.totalTVA)}</span>
          </div>
        </div>

        <div className="stat-card stat-all-status">
          <h3>📈 Toutes les commandes</h3>
          <div className="status-list">
            {dashboard.ordersByStatus.map((status) => (
              <div key={status.status} className="status-item">
                <span className="status-label">{getStatusLabel(status.status)}</span>
                <span className="status-value">{status.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="charts-section">
        <div className="section-header">
          <h2>📈 Graphiques et Analyses</h2>
          <div className="period-filters">
            <button
              className={`period-btn ${chartPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setChartPeriod('week')}
            >
              7 jours
            </button>
            <button
              className={`period-btn ${chartPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setChartPeriod('month')}
            >
              30 jours
            </button>
            <button
              className={`period-btn ${chartPeriod === 'year' ? 'active' : ''}`}
              onClick={() => setChartPeriod('year')}
            >
              1 an
            </button>
          </div>
        </div>

        <div className="charts-grid">
          {/* Évolution des ventes */}
          {salesEvolution && salesEvolution.length > 0 && (
            <div className="chart-card">
              <h3>📈 Évolution des ventes</h3>
              <Line
                data={{
                  labels: salesEvolution.map(item => 
                    new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                  ),
                  datasets: [
                    {
                      label: 'Total TTC (€)',
                      data: salesEvolution.map(item => item.totalTTC),
                      borderColor: 'rgb(40, 167, 69)',
                      backgroundColor: 'rgba(40, 167, 69, 0.1)',
                      tension: 0.4
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return formatPrice(value);
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          )}

          {/* Top produits */}
          {topProducts && topProducts.length > 0 && (
            <div className="chart-card">
              <h3>🏆 Top 10 Produits</h3>
              <Bar
                data={{
                  labels: topProducts.map(p => p.productName),
                  datasets: [
                    {
                      label: 'Quantité vendue',
                      data: topProducts.map(p => p.totalQuantity),
                      backgroundColor: 'rgba(54, 162, 235, 0.6)',
                      borderColor: 'rgba(54, 162, 235, 1)',
                      borderWidth: 1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          )}

          {/* Répartition par catégorie */}
          {categoryDistribution && categoryDistribution.length > 0 && (
            <div className="chart-card">
              <h3>🥗 Répartition par catégorie</h3>
              <Doughnut
                data={{
                  labels: categoryDistribution.map(c => {
                    const labels = {
                      'FRUITS': '🍎 Fruits',
                      'LEGUMES': '🥬 Légumes',
                      'HERBES': '🌿 Herbes',
                      'FRUITS_SECS': '🥜 Fruits secs'
                    };
                    return labels[c.category] || c.category;
                  }),
                  datasets: [
                    {
                      data: categoryDistribution.map(c => c.totalRevenue),
                      backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                      ],
                      borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                      ],
                      borderWidth: 2
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const value = context.parsed;
                          return `${context.label}: ${formatPrice(value)}`;
                        }
                      }
                    }
                  }
                }}
              />
              <div className="category-stats">
                {categoryDistribution.map(cat => {
                  const labels = {
                    'FRUITS': '🍎 Fruits',
                    'LEGUMES': '🥬 Légumes',
                    'HERBES': '🌿 Herbes',
                    'FRUITS_SECS': '🥜 Fruits secs'
                  };
                  return (
                    <div key={cat.category} className="category-stat-item">
                      <span>{labels[cat.category] || cat.category}</span>
                      <span>{formatPrice(cat.totalRevenue)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
