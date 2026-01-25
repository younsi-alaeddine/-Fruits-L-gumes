import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './CommercialQuotes.css';

const CommercialQuotes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const shopId = searchParams.get('shopId');
  const [quotes, setQuotes] = useState([]);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [formData, setFormData] = useState({
    shopId: shopId || '',
    items: [{ productId: '', quantity: 1, priceHT: 0 }],
    validUntil: '',
    notes: ''
  });

  useEffect(() => {
    fetchQuotes();
    fetchShops();
    fetchProducts();
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

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops');
      if (response.data.success) {
        setShops(response.data.shops || []);
      }
    } catch (error) {
      console.error('Erreur chargement magasins:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      if (response.data.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/quotes', formData);
      if (response.data.success) {
        toast.success('Devis créé avec succès');
        setShowForm(false);
        setFormData({
          shopId: '',
          items: [{ productId: '', quantity: 1, priceHT: 0 }],
          validUntil: '',
          notes: ''
        });
        fetchQuotes();
      }
    } catch (error) {
      toast.error('Erreur lors de la création du devis');
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
    <div className="commercial-quotes">
      <div className="header-section">
        <h1>📋 Gestion des Devis</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          ➕ Créer un devis
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouveau Devis</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="quote-form">
              <div className="form-group">
                <label>Client</label>
                <select
                  value={formData.shopId}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopId: e.target.value }))}
                  required
                >
                  <option value="">Sélectionner un client</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Date de validité</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                  required
                />
              </div>

              <div className="items-section">
                <label>Produits</label>
                {formData.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const product = products.find(p => p.id === e.target.value);
                        const newItems = [...formData.items];
                        newItems[index] = {
                          ...newItems[index],
                          productId: e.target.value,
                          priceHT: product?.priceHT || 0
                        };
                        setFormData(prev => ({ ...prev, items: newItems }));
                      }}
                      required
                    >
                      <option value="">Sélectionner un produit</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Quantité"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].quantity = parseFloat(e.target.value);
                        setFormData(prev => ({ ...prev, items: newItems }));
                      }}
                      min="0.1"
                      step="0.1"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          items: prev.items.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      items: [...prev.items, { productId: '', quantity: 1, priceHT: 0 }]
                    }));
                  }}
                >
                  ➕ Ajouter un produit
                </button>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit">Créer le devis</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="quotes-list">
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : quotes.length === 0 ? (
          <div className="no-quotes">Aucun devis</div>
        ) : (
          quotes.map(quote => (
            <div key={quote.id} className="quote-card">
              <div className="quote-header">
                <div>
                  <h3>Devis #{quote.id.slice(0, 8)}</h3>
                  <p>{quote.shop?.name}</p>
                </div>
                <span className={`status-badge status-${quote.status?.toLowerCase()}`}>
                  {quote.status}
                </span>
              </div>
              <div className="quote-details">
                <p><strong>Date:</strong> {new Date(quote.createdAt).toLocaleDateString('fr-FR')}</p>
                <p><strong>Valide jusqu'au:</strong> {new Date(quote.validUntil).toLocaleDateString('fr-FR')}</p>
                <p><strong>Total TTC:</strong> {formatPrice(quote.totalTTC)}</p>
              </div>
              <div className="quote-actions">
                <button onClick={() => setSelectedQuote(quote)}>Voir détails</button>
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

export default CommercialQuotes;
