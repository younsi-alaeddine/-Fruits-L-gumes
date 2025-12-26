import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './ClientCart.css';

const ClientCart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : {};
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: quantity
      }
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  };

  const calculateTotal = () => {
    return Object.values(cart).reduce((sum, item) => {
      const priceTTC = item.priceHT * (1 + (item.tvaRate || 5.5) / 100);
      return sum + (priceTTC * item.quantity);
    }, 0);
  };

  const submitOrder = async () => {
    try {
      setSubmitting(true);
      const items = Object.values(cart).map(item => ({
        productId: item.id,
        quantity: item.quantity,
        priceHT: item.priceHT
      }));

      const response = await api.post('/orders', { items });
      if (response.data.success) {
        toast.success('Commande créée avec succès');
        localStorage.removeItem('cart');
        setCart({});
        navigate('/client/orders');
      }
    } catch (error) {
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price || 0);
  };

  const cartItems = Object.values(cart);
  const total = calculateTotal();

  if (cartItems.length === 0) {
    return (
      <div className="client-cart empty">
        <h1>🛒 Mon Panier</h1>
        <div className="empty-cart">
          <p>Votre panier est vide</p>
          <button onClick={() => navigate('/client/catalog')}>
            Aller au catalogue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-cart">
      <h1>🛒 Mon Panier</h1>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map(item => (
            <div key={item.id} className="cart-item">
              <div className="item-info">
                <h3>{item.name}</h3>
                <p>{formatPrice(item.priceHT)} / {item.unit}</p>
              </div>
              <div className="item-quantity">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                  ➖
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value))}
                  min="0.1"
                  step="0.1"
                />
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                  ➕
                </button>
              </div>
              <div className="item-total">
                {formatPrice(item.priceHT * (1 + (item.tvaRate || 5.5) / 100) * item.quantity)}
              </div>
              <button className="btn-remove" onClick={() => removeFromCart(item.id)}>
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Résumé</h2>
          <div className="summary-line">
            <span>Total TTC:</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <button
            className="btn-submit"
            onClick={submitOrder}
            disabled={submitting}
          >
            {submitting ? 'En cours...' : 'Commander'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientCart;
