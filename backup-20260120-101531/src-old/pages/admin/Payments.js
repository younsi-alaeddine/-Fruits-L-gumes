import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './AdminPayments.css';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    orderId: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [formData, setFormData] = useState({
    orderId: '',
    amount: '',
    paymentMethod: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'PAYE',
    notes: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.orderId) params.append('orderId', filters.orderId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/payments?${params.toString()}`);
      setPayments(response.data.payments);
    } catch (error) {
      toast.error('Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderPayments = async (orderId) => {
    try {
      const response = await api.get(`/payments/order/${orderId}`);
      setSelectedOrder({
        id: orderId,
        payments: response.data.payments
      });
    } catch (error) {
      toast.error('Erreur lors du chargement des paiements');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', formData);
      toast.success('Paiement créé avec succès');
      resetForm();
      fetchPayments();
      if (selectedOrder) {
        fetchOrderPayments(selectedOrder.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      return;
    }

    try {
      await api.delete(`/payments/${paymentId}`);
      toast.success('Paiement supprimé avec succès');
      fetchPayments();
      if (selectedOrder) {
        fetchOrderPayments(selectedOrder.id);
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      amount: '',
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'PAYE',
      notes: ''
    });
    setShowForm(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      EN_ATTENTE: 'En attente',
      PAYE: 'Payé',
      IMPAYE: 'Impayé',
      REMBOURSE: 'Remboursé'
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      EN_ATTENTE: 'status-waiting',
      PAYE: 'status-paid',
      IMPAYE: 'status-unpaid',
      REMBOURSE: 'status-refunded'
    };
    return classes[status] || '';
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      CASH: '💵 Espèces',
      CARD: '💳 Carte',
      TRANSFER: '🏦 Virement',
      CHECK: '📝 Chèque'
    };
    return labels[method] || method || '—';
  };

  if (loading) {
    return <div className="loading">Chargement des paiements...</div>;
  }

  const totalPaid = payments
    .filter(p => p.status === 'PAYE')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalUnpaid = payments
    .filter(p => p.status === 'IMPAYE')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="admin-payments">
      <div className="payments-header">
        <h1>💳 Gestion des Paiements</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Annuler' : '+ Nouveau paiement'}
        </button>
      </div>

      {/* Résumé */}
      <div className="payments-summary">
        <div className="summary-card">
          <div className="summary-label">Total payé</div>
          <div className="summary-value success">{formatPrice(totalPaid)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total impayé</div>
          <div className="summary-value danger">{formatPrice(totalUnpaid)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Nombre de paiements</div>
          <div className="summary-value">{payments.length}</div>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="payment-form-card">
          <h2>Nouveau paiement</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Commande *</label>
                <select
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionner une commande</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.shop.name} - {formatPrice(order.totalTTC)} - {formatDate(order.createdAt)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Montant (€) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Méthode de paiement</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                >
                  <option value="CASH">💵 Espèces</option>
                  <option value="CARD">💳 Carte</option>
                  <option value="TRANSFER">🏦 Virement</option>
                  <option value="CHECK">📝 Chèque</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date de paiement *</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Statut *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="PAYE">Payé</option>
                  <option value="IMPAYE">Impayé</option>
                  <option value="REMBOURSE">Remboursé</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Créer le paiement
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div className="filters-card">
        <h3>Filtres</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Commande</label>
            <select
              value={filters.orderId}
              onChange={(e) => setFilters({ ...filters, orderId: e.target.value })}
            >
              <option value="">Toutes les commandes</option>
              {orders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.shop.name} - {formatPrice(order.totalTTC)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="PAYE">Payé</option>
              <option value="IMPAYE">Impayé</option>
              <option value="REMBOURSE">Remboursé</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date début</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Date fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="payments-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Commande</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Méthode</th>
              <th>Statut</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">Aucun paiement</td>
              </tr>
            ) : (
              payments.map(payment => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.paymentDate)}</td>
                  <td>
                    <button
                      onClick={() => fetchOrderPayments(payment.orderId)}
                      className="btn-link"
                    >
                      Commande #{payment.orderId.substring(0, 8)}
                    </button>
                  </td>
                  <td>
                    <div>
                      <strong>{payment.order.shop.name}</strong>
                      <div className="shop-city">{payment.order.shop.city}</div>
                    </div>
                  </td>
                  <td className="price-cell"><strong>{formatPrice(payment.amount)}</strong></td>
                  <td>{getPaymentMethodLabel(payment.paymentMethod)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </td>
                  <td>{payment.notes || '—'}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(payment.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal détails commande */}
      {selectedOrder && (
        <div className="order-payments-modal" onClick={() => setSelectedOrder(null)}>
          <div className="order-payments-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Paiements de la commande</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {selectedOrder.payments && selectedOrder.payments.length > 0 ? (
                <>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Montant</th>
                        <th>Méthode</th>
                        <th>Statut</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.payments.map(payment => (
                        <tr key={payment.id}>
                          <td>{formatDate(payment.paymentDate)}</td>
                          <td className="price-cell">{formatPrice(payment.amount)}</td>
                          <td>{getPaymentMethodLabel(payment.paymentMethod)}</td>
                          <td>
                            <span className={`status-badge ${getStatusClass(payment.status)}`}>
                              {getStatusLabel(payment.status)}
                            </span>
                          </td>
                          <td>{payment.notes || '—'}</td>
                          <td>
                            <button
                              onClick={() => handleDelete(payment.id)}
                              className="btn btn-danger btn-sm"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="payment-totals">
                    <div className="total-row">
                      <span>Total payé :</span>
                      <span className="success">
                        {formatPrice(
                          selectedOrder.payments
                            .filter(p => p.status === 'PAYE')
                            .reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">Aucun paiement pour cette commande</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;

