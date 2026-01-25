import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './LivreurDelivery.css';

const LivreurDelivery = () => {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [signature, setSignature] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetchDeliveryDetails();
  }, [deliveryId]);

  const fetchDeliveryDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/deliveries/${deliveryId}`);
      if (response.data.success) {
        setDelivery(response.data.delivery);
        setDeliveryNotes(response.data.delivery.notes || '');
      } else {
        toast.error('Livraison introuvable');
        navigate('/livreur/deliveries');
      }
    } catch (error) {
      console.error('Erreur chargement livraison:', error);
      toast.error('Erreur lors du chargement de la livraison');
      navigate('/livreur/deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La photo ne doit pas dépasser 5MB');
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartDelivery = async () => {
    try {
      await api.put(`/deliveries/${deliveryId}`, { 
        status: 'IN_TRANSIT' 
      });
      toast.success('Livraison démarrée');
      fetchDeliveryDetails();
    } catch (error) {
      toast.error('Erreur lors du démarrage de la livraison');
    }
  };

  const handleCompleteDelivery = async () => {
    try {
      const formData = new FormData();
      formData.append('status', 'DELIVERED');
      formData.append('deliveredAt', new Date().toISOString());
      
      if (deliveryNotes) {
        formData.append('notes', deliveryNotes);
      }
      
      if (photo) {
        formData.append('photo', photo);
      }
      
      if (signature) {
        formData.append('signature', signature);
      }

      await api.put(`/deliveries/${deliveryId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Si paiement à la livraison
      if (paymentMethod && paymentAmount) {
        try {
          await api.post('/payments', {
            orderId: delivery.orderId,
            amount: parseFloat(paymentAmount),
            method: paymentMethod,
            status: 'PAID'
          });
        } catch (error) {
          console.error('Erreur enregistrement paiement:', error);
        }
      }

      toast.success('Livraison complétée avec succès !');
      navigate('/livreur/deliveries');
    } catch (error) {
      console.error('Erreur finalisation livraison:', error);
      toast.error('Erreur lors de la finalisation de la livraison');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Chargement de la livraison...</div>;
  }

  if (!delivery) {
    return <div className="error">Livraison introuvable</div>;
  }

  const order = delivery.order;
  const canComplete = delivery.status === 'IN_TRANSIT' || delivery.status === 'SCHEDULED';

  return (
    <div className="livreur-delivery">
      <div className="delivery-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/livreur/deliveries')}
        >
          ← Retour à la liste
        </button>
        <h1>🚚 Livraison #{delivery.id.slice(0, 8)}</h1>
      </div>

      {/* Informations de la livraison */}
      <div className="delivery-info-card">
        <h2>Informations de Livraison</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Statut:</strong> 
            <span className={`status-badge status-${delivery.status?.toLowerCase().replace('_', '-')}`}>
              {delivery.status || 'SCHEDULED'}
            </span>
          </div>
          <div className="info-item">
            <strong>Date prévue:</strong> {formatDate(delivery.deliveryDate)}
          </div>
          {delivery.timeSlot && (
            <div className="info-item">
              <strong>Créneau:</strong> {delivery.timeSlot}
            </div>
          )}
          {delivery.deliveredAt && (
            <div className="info-item">
              <strong>Livrée le:</strong> {formatDate(delivery.deliveredAt)}
            </div>
          )}
        </div>
      </div>

      {/* Adresse de livraison */}
      <div className="address-card">
        <h2>📍 Adresse de Livraison</h2>
        <div className="address-details">
          <p><strong>Magasin:</strong> {order?.shop?.name || 'N/A'}</p>
          <p><strong>Adresse:</strong> {order?.shop?.address || 'N/A'}</p>
          <p><strong>Ville:</strong> {order?.shop?.city || 'N/A'} {order?.shop?.postalCode || ''}</p>
          {order?.shop?.phone && (
            <p><strong>Téléphone:</strong> 
              <a href={`tel:${order.shop.phone}`}> {order.shop.phone}</a>
            </p>
          )}
        </div>
        <div className="map-section">
          <button className="btn-map" onClick={() => {
            const address = `${order?.shop?.address}, ${order?.shop?.city}`;
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
          }}>
            🗺️ Ouvrir dans Google Maps
          </button>
        </div>
      </div>

      {/* Détails de la commande */}
      <div className="order-details-card">
        <h2>📦 Détails de la Commande</h2>
        <div className="order-summary">
          <p><strong>Commande:</strong> #{order?.id?.slice(0, 8) || 'N/A'}</p>
          <p><strong>Total TTC:</strong> {formatPrice(order?.totalTTC)}</p>
          <p><strong>Articles:</strong> {order?.items?.length || 0} produit(s)</p>
        </div>
        <div className="products-list">
          <h3>Produits:</h3>
          {order?.items?.map((item, idx) => (
            <div key={idx} className="product-item">
              <span>{item.product?.name || 'Produit supprimé'}</span>
              <span>x{item.quantity} {item.product?.unit || ''}</span>
              <span>{formatPrice(item.totalHT)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions de livraison */}
      {canComplete && (
        <div className="delivery-actions-card">
          <h2>Actions de Livraison</h2>
          
          {/* Notes */}
          <div className="notes-section">
            <label>Notes de livraison (optionnel)</label>
            <textarea
              className="notes-textarea"
              placeholder="Ajoutez des notes sur la livraison..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Photo */}
          <div className="photo-section">
            <label className="photo-label">
              📷 Photo de la livraison (optionnel)
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="photo-input"
              />
            </label>
            {photoPreview && (
              <div className="photo-preview">
                <img src={photoPreview} alt="Aperçu" />
                <button 
                  className="btn-remove-photo"
                  onClick={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                  }}
                >
                  ✕ Supprimer
                </button>
              </div>
            )}
          </div>

          {/* Paiement à la livraison */}
          {order?.paymentStatus !== 'PAID' && (
            <div className="payment-section">
              <h3>💳 Paiement à la Livraison</h3>
              <div className="payment-fields">
                <div className="form-group">
                  <label>Méthode de paiement</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="CASH">Espèces</option>
                    <option value="CARD">Carte bancaire</option>
                    <option value="CHECK">Chèque</option>
                  </select>
                </div>
                {paymentMethod && (
                  <div className="form-group">
                    <label>Montant reçu</label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={formatPrice(order?.totalTTC)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="actions-section">
        {delivery.status === 'SCHEDULED' && (
          <button
            className="btn btn-start"
            onClick={handleStartDelivery}
          >
            🚀 Démarrer la Livraison
          </button>
        )}
        
        {canComplete && (
          <button
            className="btn btn-complete"
            onClick={handleCompleteDelivery}
          >
            ✅ Finaliser la Livraison
          </button>
        )}
      </div>
    </div>
  );
};

export default LivreurDelivery;
