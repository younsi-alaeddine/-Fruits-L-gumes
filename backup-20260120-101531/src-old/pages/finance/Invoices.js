import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './FinanceInvoices.css';

const FinanceInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/invoices?${params.toString()}`);
      if (response.data.success) {
        setInvoices(response.data.invoices || []);
      }
    } catch (error) {
      console.error('Erreur chargement factures:', error);
      toast.error('Erreur lors du chargement des factures');
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
    <div className="finance-invoices">
      <h1>📄 Gestion des Factures</h1>

      <div className="filters-card">
        <div className="filters-grid">
          <div className="form-group">
            <label>Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Tous</option>
              <option value="PAID">Payées</option>
              <option value="PENDING">En attente</option>
              <option value="OVERDUE">En retard</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date début</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Date fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="invoices-table-container">
        <table className="invoices-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Date</th>
              <th>Montant TTC</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="loading-cell">Chargement...</td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">Aucune facture</td>
              </tr>
            ) : (
              invoices.map(invoice => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber || invoice.id.slice(0, 8)}</td>
                  <td>{invoice.order?.shop?.name || 'N/A'}</td>
                  <td>{new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>{formatPrice(invoice.totalTTC)}</td>
                  <td>
                    <span className={`status-badge status-${invoice.status?.toLowerCase()}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-view">Voir</button>
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

export default FinanceInvoices;
