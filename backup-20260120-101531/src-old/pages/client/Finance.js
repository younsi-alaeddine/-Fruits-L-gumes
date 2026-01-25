import React, { useState, useEffect } from 'react';
import api, { getServerBaseURL } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './ClientFinance.css';

const ClientFinance = () => {
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchSummary();
    fetchInvoices();
    fetchPayments();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await api.get('/client/finance/summary');
      if (response.data.success) {
        setSummary(response.data.summary);
        setInvoices(response.data.invoices);
      }
    } catch (error) {
      console.error('Erreur chargement résumé:', error);
      toast.error('Erreur lors du chargement du résumé financier');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/client/finance/invoices');
      if (response.data.success) {
        setInvoices(response.data.invoices);
      }
    } catch (error) {
      console.error('Erreur chargement factures:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await api.get('/client/finance/payments');
      if (response.data.success) {
        setPayments(response.data.payments);
      }
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
    }
  };

  const handleDownloadInvoice = (invoice) => {
    const url = `${getServerBaseURL()}/api/invoices/${invoice.id}/download`;
    window.open(url, '_blank');
  };

  const handleDownloadReceipt = async (payment) => {
    try {
      // Afficher un message de chargement
      toast.info('Génération du reçu en cours...');
      
      const response = await api.get(`/payments/${payment.id}/download-receipt`, {
        responseType: 'blob',
      });

      // Créer un blob à partir de la réponse
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      const receiptNumber = payment.receiptNumber || payment.id.substring(0, 8);
      link.setAttribute('download', `recu-paiement-${receiptNumber}.pdf`);
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Libérer l'URL de l'objet
      window.URL.revokeObjectURL(url);
      
      toast.success('Reçu téléchargé avec succès');
    } catch (error) {
      console.error('Erreur téléchargement reçu:', error);
      toast.error('Erreur lors du téléchargement du reçu');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      PAYE: { text: 'Payé', class: 'badge-paid' },
      PARTIEL: { text: 'Partiel', class: 'badge-partial' },
      EN_ATTENTE: { text: 'En attente', class: 'badge-pending' },
    };
    return badges[status] || badges.EN_ATTENTE;
  };

  if (loading) {
    return <div className="loading">Chargement de votre situation financière...</div>;
  }

  return (
    <div className="client-finance">
      <div className="finance-header">
        <h1>💰 Ma Situation Financière</h1>
      </div>

      {/* Résumé financier */}
      {summary && (
        <div className="finance-summary-cards">
          <div className={`summary-card ${summary.balance > 0 ? 'card-debt' : summary.balance < 0 ? 'card-credit' : 'card-balanced'}`}>
            <div className="summary-card-icon">
              {summary.balance > 0 ? '⚠️' : summary.balance < 0 ? '✅' : '💰'}
            </div>
            <div className="summary-card-content">
              <h3>Solde</h3>
              <div className="summary-card-amount">
                {summary.balance > 0 ? (
                  <>
                    <span className="amount-label">Dette:</span>
                    <span className="amount-value debt">{formatPrice(summary.balance)}</span>
                  </>
                ) : summary.balance < 0 ? (
                  <>
                    <span className="amount-label">Crédit:</span>
                    <span className="amount-value credit">{formatPrice(Math.abs(summary.balance))}</span>
                  </>
                ) : (
                  <>
                    <span className="amount-label">Solde:</span>
                    <span className="amount-value balanced">{formatPrice(0)}</span>
                  </>
                )}
              </div>
              <p className="summary-card-description">
                {summary.balance > 0
                  ? `Vous avez ${formatPrice(summary.balance)} à régler`
                  : summary.balance < 0
                  ? `Vous avez un crédit de ${formatPrice(Math.abs(summary.balance))}`
                  : 'Tout est à jour'}
              </p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-icon">📄</div>
            <div className="summary-card-content">
              <h3>Total Facturé</h3>
              <div className="summary-card-amount">
                <span className="amount-value">{formatPrice(summary.totalInvoiced)}</span>
              </div>
              <p className="summary-card-description">
                {summary.totalInvoices} facture{summary.totalInvoices > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-icon">💳</div>
            <div className="summary-card-content">
              <h3>Total Payé</h3>
              <div className="summary-card-amount">
                <span className="amount-value">{formatPrice(summary.totalPaid)}</span>
              </div>
              <p className="summary-card-description">
                {summary.paidInvoices} facture{summary.paidInvoices > 1 ? 's' : ''} payée{summary.paidInvoices > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-icon">⏳</div>
            <div className="summary-card-content">
              <h3>En Attente</h3>
              <div className="summary-card-amount">
                <span className="amount-value">
                  {summary.unpaidInvoices > 0 ? (
                    <span className="unpaid-count">{summary.unpaidInvoices}</span>
                  ) : (
                    '0'
                  )}
                </span>
              </div>
              <p className="summary-card-description">
                {summary.unpaidInvoices > 0
                  ? `${summary.unpaidInvoices} facture${summary.unpaidInvoices > 1 ? 's' : ''} impayée${summary.unpaidInvoices > 1 ? 's' : ''}`
                  : 'Tout est payé'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="finance-tabs">
        <button
          className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          📊 Résumé
        </button>
        <button
          className={`tab-button ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          📄 Factures ({invoices.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💳 Paiements ({payments.length})
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="finance-content">
        {activeTab === 'summary' && summary && (
          <div className="summary-details">
            <div className="detail-section">
              <h3>📊 Détails du Solde</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Total facturé:</span>
                  <span className="detail-value">{formatPrice(summary.totalInvoiced)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total payé:</span>
                  <span className="detail-value">{formatPrice(summary.totalPaid)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Solde:</span>
                  <span className={`detail-value ${summary.balance > 0 ? 'debt' : summary.balance < 0 ? 'credit' : ''}`}>
                    {formatPrice(summary.balance)}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>📄 État des Factures</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Total factures:</span>
                  <span className="detail-value">{summary.totalInvoices}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Payées:</span>
                  <span className="detail-value success">{summary.paidInvoices}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Partielles:</span>
                  <span className="detail-value warning">{summary.partialInvoices}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Impayées:</span>
                  <span className="detail-value danger">{summary.unpaidInvoices}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="invoices-list">
            {invoices.length === 0 ? (
              <div className="empty-state">
                <p>Aucune facture disponible</p>
              </div>
            ) : (
              <div className="invoices-table-container">
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Numéro</th>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Payé</th>
                      <th>Reste</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => {
                      const statusBadge = getPaymentStatusBadge(invoice.paymentStatus);
                      return (
                        <tr key={invoice.id} className={invoice.isPaid ? 'row-paid' : invoice.remainingAmount > 0 ? 'row-partial' : 'row-unpaid'}>
                          <td>
                            <strong>{invoice.invoiceNumber}</strong>
                          </td>
                          <td>
                            {format(new Date(invoice.generatedAt), 'PP', { locale: fr })}
                          </td>
                          <td>{formatPrice(invoice.orderTotal)}</td>
                          <td className="paid-amount">{formatPrice(invoice.paidAmount)}</td>
                          <td className={`remaining-amount ${invoice.remainingAmount > 0 ? 'has-debt' : ''}`}>
                            {formatPrice(invoice.remainingAmount)}
                          </td>
                          <td>
                            <span className={`status-badge ${statusBadge.class}`}>
                              {statusBadge.text}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleDownloadInvoice(invoice)}
                              title="Télécharger la facture"
                            >
                              📥 PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="payments-list">
            {payments.length === 0 ? (
              <div className="empty-state">
                <p>Aucun paiement enregistré</p>
              </div>
            ) : (
              <div className="payments-table-container">
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Méthode</th>
                      <th>Statut</th>
                      <th>Commande</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          {payment.paymentDate
                            ? format(new Date(payment.paymentDate), 'PP', { locale: fr })
                            : format(new Date(payment.createdAt), 'PP', { locale: fr })}
                        </td>
                        <td>{formatPrice(payment.amount)}</td>
                        <td>{payment.paymentMethod || 'Non spécifiée'}</td>
                        <td>
                          <span className={`status-badge ${payment.status === 'PAYE' ? 'badge-paid' : 'badge-pending'}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td>
                          {payment.order.orderNumber || payment.order.id.substring(0, 8)}
                        </td>
                        <td>
                          {payment.status === 'PAYE' && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleDownloadReceipt(payment)}
                              title="Télécharger le reçu"
                            >
                              📄 Reçu
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
        )}
      </div>
    </div>
  );
};

export default ClientFinance;
