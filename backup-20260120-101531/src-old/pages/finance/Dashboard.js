import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './FinanceDashboard.css';

const FinanceDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    paidToday: 0
  });

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments');
      if (response.data.success) {
        setPayments(response.data.payments || []);
      }
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
      toast.error('Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/payments/stats');
      if (response.data.success) {
        setStats({
          totalRevenue: response.data.stats?.totalRevenue || 0,
          pendingPayments: response.data.stats?.pendingPayments || 0,
          paidToday: response.data.stats?.paidToday || 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    try {
      const response = await api.patch(`/payments/${paymentId}`, { status: newStatus });
      if (response.data.success) {
        toast.success('Statut mis à jour avec succès');
        fetchPayments();
        fetchStats();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price || 0);
  };

  return (
    <div className="finance-dashboard">
      <h1>💰 Tableau de Bord - Finance</h1>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <div className="stat-value">{formatPrice(stats.totalRevenue)}</div>
            <div className="stat-label">Revenus totaux</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pendingPayments}</div>
            <div className="stat-label">Paiements en attente</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{formatPrice(stats.paidToday)}</div>
            <div className="stat-label">Payé aujourd'hui</div>
          </div>
        </div>
      </div>

      {/* Liste des paiements */}
      <div className="payments-section">
        <h2>Paiements récents</h2>
        {payments.length === 0 ? (
          <div className="no-payments">
            <p>Aucun paiement enregistré</p>
          </div>
        ) : (
          <div className="payments-table">
            <table>
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Montant</th>
                  <th>Méthode</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>#{payment.orderId?.slice(0, 8)}</td>
                    <td>{formatPrice(payment.amount)}</td>
                    <td>{payment.paymentMethod || 'N/A'}</td>
                    <td>
                      {payment.paymentDate 
                        ? new Date(payment.paymentDate).toLocaleDateString('fr-FR')
                        : 'N/A'}
                    </td>
                    <td>
                      <span className={`status-badge status-${payment.status}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      {payment.status === 'EN_ATTENTE' && (
                        <button
                          className="btn btn-success"
                          onClick={() => updatePaymentStatus(payment.id, 'PAYE')}
                        >
                          Marquer payé
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceDashboard;
