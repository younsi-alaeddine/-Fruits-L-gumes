import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './PreparateurPreparation.css';

const PreparateurPreparation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preparationNotes, setPreparationNotes] = useState('');
  const [preparedItems, setPreparedItems] = useState(new Set());
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.order);
        // Initialiser les items préparés si la commande est déjà en préparation
        if (response.data.order.status === 'PREPARATION') {
          // Optionnel: récupérer l'état de préparation depuis le backend
        }
      } else {
        toast.error('Commande introuvable');
        navigate('/preparateur/orders');
      }
    } catch (error) {
      console.error('Erreur chargement commande:', error);
      toast.error('Erreur lors du chargement de la commande');
      navigate('/preparateur/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = (itemId) => {
    setPreparedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
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

  const checkStockAvailability = async (productId, quantity) => {
    try {
      const response = await api.get(`/products/${productId}`);
      if (response.data.success) {
        const product = response.data.product;
        if (product.stock < quantity) {
          toast.warning(
            `Stock insuffisant pour ${product.name}. Stock disponible: ${product.stock}, Demandé: ${quantity}`
          );
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('Erreur vérification stock:', error);
      toast.error('Erreur lors de la vérification du stock');
      return false;
    }
  };

  const handleStartPreparation = async () => {
    try {
      // Vérifier le stock pour tous les produits
      let allStockAvailable = true;
      for (const item of order.items) {
        const available = await checkStockAvailability(item.productId, item.quantity);
        if (!available) {
          allStockAvailable = false;
        }
      }

      if (!allStockAvailable) {
        toast.error('Stock insuffisant pour certains produits');
        return;
      }

      // Mettre à jour le statut de la commande
      await api.patch(`/orders/${orderId}/status`, { status: 'PREPARATION' });
      toast.success('Préparation démarrée');
      fetchOrderDetails();
    } catch (error) {
      toast.error('Erreur lors du démarrage de la préparation');
    }
  };

  const handleCompletePreparation = async () => {
    try {
      // Vérifier que tous les items sont préparés
      if (preparedItems.size !== order.items.length) {
        toast.warning('Veuillez cocher tous les produits préparés');
        return;
      }

      // Vérifier le stock et déduire
      for (const item of order.items) {
        const available = await checkStockAvailability(item.productId, item.quantity);
        if (!available) {
          return;
        }
      }

      // Préparer les données pour l'upload
      const formData = new FormData();
      formData.append('status', 'LIVRAISON');
      if (preparationNotes) {
        formData.append('notes', preparationNotes);
      }
      if (photo) {
        formData.append('photo', photo);
      }

      // Mettre à jour le statut et déduire le stock
      await api.patch(`/orders/${orderId}/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Déduire le stock pour chaque produit
      for (const item of order.items) {
        try {
          await api.patch(`/products/${item.productId}/stock`, {
            quantity: -item.quantity,
            reason: 'PREPARATION_ORDER',
            orderId: orderId
          });
        } catch (error) {
          console.error(`Erreur déduction stock pour ${item.productId}:`, error);
        }
      }

      toast.success('Commande préparée avec succès ! Prête pour la livraison.');
      navigate('/preparateur/orders');
    } catch (error) {
      console.error('Erreur finalisation préparation:', error);
      toast.error('Erreur lors de la finalisation de la préparation');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price || 0);
  };

  if (loading) {
    return <div className="loading">Chargement de la commande...</div>;
  }

  if (!order) {
    return <div className="error">Commande introuvable</div>;
  }

  const allItemsPrepared = preparedItems.size === order.items.length;
  const isInPreparation = order.status === 'PREPARATION';

  return (
    <div className="preparateur-preparation">
      <div className="preparation-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/preparateur/orders')}
        >
          ← Retour à la liste
        </button>
        <h1>📦 Préparation de la Commande #{order.id.slice(0, 8)}</h1>
      </div>

      {/* Informations de la commande */}
      <div className="order-info-card">
        <h2>Informations de la Commande</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Magasin:</strong> {order.shop?.name}
          </div>
          <div className="info-item">
            <strong>Ville:</strong> {order.shop?.city}
          </div>
          <div className="info-item">
            <strong>Adresse:</strong> {order.shop?.address}
          </div>
          <div className="info-item">
            <strong>Contact:</strong> {order.shop?.phone || 'N/A'}
          </div>
          <div className="info-item">
            <strong>Date de commande:</strong> {new Date(order.createdAt).toLocaleDateString('fr-FR')}
          </div>
          {order.deliveryDate && (
            <div className="info-item">
              <strong>Livraison prévue:</strong> {new Date(order.deliveryDate).toLocaleDateString('fr-FR')}
            </div>
          )}
          <div className="info-item">
            <strong>Total TTC:</strong> {formatPrice(order.totalTTC)}
          </div>
          <div className="info-item">
            <strong>Statut:</strong> 
            <span className={`status-badge status-${order.status.toLowerCase()}`}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      {/* Liste des produits à préparer */}
      <div className="products-section">
        <h2>Produits à Préparer ({preparedItems.size}/{order.items.length})</h2>
        <div className="products-list">
          {order.items.map((item) => {
            const isPrepared = preparedItems.has(item.id);
            const stockAvailable = item.product?.stock >= item.quantity;
            
            return (
              <div 
                key={item.id} 
                className={`product-item ${isPrepared ? 'prepared' : ''} ${!stockAvailable ? 'low-stock' : ''}`}
              >
                <div className="product-checkbox">
                  <input
                    type="checkbox"
                    id={`item-${item.id}`}
                    checked={isPrepared}
                    onChange={() => handleItemToggle(item.id)}
                    disabled={!isInPreparation}
                  />
                  <label htmlFor={`item-${item.id}`}></label>
                </div>
                <div className="product-image">
                  {item.product?.photo ? (
                    <img 
                      src={`${api.defaults.baseURL || ''}/uploads/products/${item.product.photo}`} 
                      alt={item.product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="no-image">📦</div>
                  )}
                </div>
                <div className="product-details">
                  <h3>{item.product?.name || 'Produit supprimé'}</h3>
                  <div className="product-info">
                    <span><strong>Quantité:</strong> {item.quantity} {item.product?.unit || ''}</span>
                    <span><strong>Prix unitaire:</strong> {formatPrice(item.priceHT)}</span>
                    <span><strong>Total:</strong> {formatPrice(item.totalHT)}</span>
                  </div>
                  <div className="stock-info">
                    <span className={stockAvailable ? 'stock-ok' : 'stock-low'}>
                      Stock disponible: {item.product?.stock || 0} {item.product?.unit || ''}
                    </span>
                    {!stockAvailable && (
                      <span className="stock-warning">
                        ⚠️ Stock insuffisant !
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes et photo */}
      <div className="preparation-notes-section">
        <h2>Notes de Préparation</h2>
        <textarea
          className="notes-textarea"
          placeholder="Ajoutez des notes sur la préparation (optionnel)..."
          value={preparationNotes}
          onChange={(e) => setPreparationNotes(e.target.value)}
          rows={4}
        />

        <div className="photo-section">
          <label className="photo-label">
            📷 Photo de la commande préparée (optionnel)
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
      </div>

      {/* Actions */}
      <div className="preparation-actions">
        {order.status === 'NEW' && (
          <button
            className="btn btn-start"
            onClick={handleStartPreparation}
          >
            🚀 Commencer la Préparation
          </button>
        )}
        
        {isInPreparation && (
          <button
            className="btn btn-complete"
            onClick={handleCompletePreparation}
            disabled={!allItemsPrepared}
          >
            ✅ Finaliser la Préparation
          </button>
        )}
      </div>
    </div>
  );
};

export default PreparateurPreparation;
