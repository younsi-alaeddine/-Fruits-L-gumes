import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './FinancePayments.css';

const FinancePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    method: '',
    status: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0
  });

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.method) params.append('method', filters.method);
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/payments?${params.toString()}`);
      if (response.data.success) {
        const paymentsList = response.data.payments || [];
        setPayments(paymentsList);
        
        const today = new Date().toISOString().split('T')[0];
        setStats({
          total: paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0),
          today: paymentsList
            .filter(p => new Date(p.createdAt).toISOString().split('T')[0] === today)
            .reduce((sum, p) => sum + (p.amount || 0), 0),
          pending: paymentsList.filter(p => p.status === 'PENDING').length
        });
      }
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
      toast.error('Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price || 0);
  };

  return (
    <div className="finance-payments">
      <h1>💳 Gestion des Paiements</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{formatPrice(stats.total)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Aujourd'hui</div>
          <div className="stat-value">{formatPrice(stats.today)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En attente</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
      </div>

      <div className="filters-card">
        <div className="filters-grid">
          <div className="form-group">
            <label>Méthode</label>
            <select
              value={filters.method}
              onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
            >
              <option value="">Toutes</option>
              <option value="CASH">Espèces</option>
              <option value="CARD">Carte</option>
              <option value="CHECK">Chèque</option>
              <option value="TRANSFER">Virement</option>
            </select>
          </div>
          <div className="form-group">
            <label>Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Tous</option>
              <option value="PAID">Payés</option>
              <option value="PENDING">En attente</option>
              <option value="FAILED">Échoués</option>
            </select>
          </div>
        </div>
      </div>

      <div className="payments-table-container">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Méthode</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="loading-cell">Chargement...</td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-cell">Aucun paiement</td>
              </tr>
            ) : (
              payments.map(payment => (
                <tr key={payment.id}>
                  <td>{new Date(payment.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>{payment.order?.shop?.name || 'N/A'}</td>
                  <td>{formatPrice(payment.amount)}</td>
                  <td>{payment.method}</td>
                  <td>
                    <span className={`status-badge status-${payment.status?.toLowerCase()}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancePayments;
