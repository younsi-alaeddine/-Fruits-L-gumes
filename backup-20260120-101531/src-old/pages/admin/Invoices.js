import React, { useState, useEffect } from 'react';
import api, { getServerBaseURL } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './AdminInvoices.css';

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  useEffect(() => {
    fetchInvoices();
  }, [pagination.page, searchTerm]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      const response = await api.get('/invoices', { params });
      setInvoices(response.data.invoices || []);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination,
      }));
    } catch (error) {
      toast.error('Erreur lors du chargement des factures');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (invoice) => {
    const url = `${getServerBaseURL()}/api/invoices/${invoice.id}/download`;
    window.open(url, '_blank');
  };

  const handleGenerate = async (orderId) => {
    try {
      const response = await api.post(`/orders/${orderId}/generate-invoice`);
      toast.success('Facture générée avec succès');
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération');
    }
  };

  const handleSendEmail = async (invoiceId) => {
    try {
      await api.post(`/invoices/${invoiceId}/send`);
      toast.success('Facture envoyée par email');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(search) ||
      invoice.order?.shop?.name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="admin-invoices">
      <div className="invoices-header">
        <h1>📄 Factures</h1>
      </div>

      <div className="invoices-filters">
        <input
          type="text"
          placeholder="Rechercher par numéro ou client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <p>Aucune facture</p>
        </div>
      ) : (
        <>
          <div className="invoices-table-container">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Client</th>
                  <th>Commande</th>
                  <th>Montant</th>
                  <th>Date</th>
                  <th>Envoyée</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong>{invoice.invoiceNumber}</strong>
                    </td>
                    <td>{invoice.order?.shop?.name || '-'}</td>
                    <td>{invoice.orderId.substring(0, 8)}</td>
                    <td>{invoice.order?.totalTTC?.toFixed(2)} €</td>
                    <td>
                      {format(new Date(invoice.generatedAt), 'PP', { locale: fr })}
                    </td>
                    <td>
                      {invoice.sentAt
                        ? format(new Date(invoice.sentAt), 'PP', { locale: fr })
                        : 'Non envoyée'}
                    </td>
                    <td>
                      <div className="invoice-actions">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleDownload(invoice)}
                        >
                          📥 Télécharger
                        </button>
                        {!invoice.sentAt && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleSendEmail(invoice.id)}
                          >
                            📧 Envoyer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Précédent
              </button>
              <span>
                Page {pagination.page} sur {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminInvoices;
