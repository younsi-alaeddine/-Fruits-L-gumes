import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './ClientQuotes.css';

const ClientQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quotes');
      if (response.data.success) {
        setQuotes(response.data.quotes || []);
      }
    } catch (error) {
      console.error('Erreur chargement devis:', error);
      toast.error('Erreur lors du chargement des devis');
    } finally {
      setLoading(false);
    }
  };

  const acceptQuote = async (quoteId) => {
    try {
      const response = await api.put(`/quotes/${quoteId}/accept`);
      if (response.data.success) {
        toast.success('Devis accepté');
        fetchQuotes();
      }
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation');
    }
  };

  const convertToOrder = async (quoteId) => {
    try {
      const response = await api.post(`/quotes/${quoteId}/convert`);
      if (response.data.success) {
        toast.success('Devis converti en commande');
        fetchQuotes();
      }
    } catch (error) {
      toast.error('Erreur lors de la conversion');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price || 0);
  };

  return (
    <div className="client-quotes">
      <h1>📋 Mes Devis</h1>

      <div className="quotes-list">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : quotes.length === 0 ? (
          <div className="no-quotes">
            <p>Aucun devis</p>
          </div>
        ) : (
          quotes.map(quote => (
            <div key={quote.id} className="quote-card">
              <div className="quote-header">
                <div>
                  <h3>Devis #{quote.id.slice(0, 8)}</h3>
                  <p>Créé le {new Date(quote.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className={`status-badge status-${quote.status?.toLowerCase()}`}>
                  {quote.status}
                </span>
              </div>
              <div className="quote-details">
                <p><strong>Valide jusqu'au:</strong> {new Date(quote.validUntil).toLocaleDateString('fr-FR')}</p>
                <p><strong>Total TTC:</strong> {formatPrice(quote.totalTTC)}</p>
                {quote.items && (
                  <div className="quote-items">
                    <strong>Produits:</strong>
                    <ul>
                      {quote.items.map((item, idx) => (
                        <li key={idx}>
                          {item.product?.name} - {item.quantity} {item.product?.unit} - {formatPrice(item.totalHT)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="quote-actions">
                {quote.status === 'PENDING' && (
                  <>
                    <button onClick={() => acceptQuote(quote.id)}>Accepter</button>
                    <button className="btn-secondary">Refuser</button>
                  </>
                )}
                {quote.status === 'ACCEPTED' && (
                  <button onClick={() => convertToOrder(quote.id)}>Convertir en commande</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientQuotes;
