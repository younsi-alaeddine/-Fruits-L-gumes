import React, { useState, useEffect } from 'react';
import api, { getServerBaseURL } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import '../admin/AdminInvoices.css';
import './ClientFinance.css';

const ClientInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/client/finance/invoices');
      if (response.data.success) {
        setInvoices(response.data.invoices || []);
      } else {
        // Fallback sur l'ancienne route
        const fallbackResponse = await api.get('/invoices');
        setInvoices(fallbackResponse.data.invoices || []);
      }
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

  return (
    <div className="admin-invoices">
      <div className="invoices-header">
        <h1>📄 Mes Factures</h1>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <p>Aucune facture disponible</p>
        </div>
      ) : (
        <div className="invoices-table-container">
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Commande</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <strong>{invoice.invoiceNumber}</strong>
                  </td>
                  <td>{invoice.orderId.substring(0, 8)}</td>
                  <td>{invoice.order?.totalTTC?.toFixed(2)} €</td>
                  <td>
                    {format(new Date(invoice.generatedAt), 'PP', { locale: fr })}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleDownload(invoice)}
                    >
                      📥 Télécharger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientInvoices;
