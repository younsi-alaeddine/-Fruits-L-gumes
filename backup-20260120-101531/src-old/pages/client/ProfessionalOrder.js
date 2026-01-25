import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './ProfessionalOrder.css';

const ProfessionalOrder = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState(null);
  
  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TOUS');
  const [pricingType, setPricingType] = useState('T1'); // T1 ou T2
  
  // Données de commande
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [grouping, setGrouping] = useState('');
  const [cart, setCart] = useState({}); // { productId: { quantity, quantityPromo, ... } }
  
  // Indicateurs financiers
  const [financials, setFinancials] = useState({
    totalPackages: 0,
    totalWeight: 0,
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    totalMargin: 0,
    totalMarginPercent: 0,
    promoRevenue: 0,
    promoRevenuePercent: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchContext();
    
    // Calculer la date de livraison par défaut (demain)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeliveryDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  useEffect(() => {
    calculateFinancials();
  }, [cart, pricingType]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      const productsData = response.data.products || response.data.success?.products || [];
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const fetchContext = async () => {
    try {
      const response = await api.get('/order-context/all');
      if (response.data.success) {
        setContext(response.data.context);
      }
    } catch (error) {
      console.error('Erreur chargement contexte', error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filtre par recherche
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.origin && p.origin.toLowerCase().includes(searchLower))
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'TOUS') {
      filtered = filtered.filter(p => 
        p.category === selectedCategory || 
        p.customCategory?.name === selectedCategory
      );
    }

    setFilteredProducts(filtered);
  };

  const getStockStatus = (product) => {
    if (product.isBlocked) return { status: 'blocked', color: 'red', label: 'Bloqué' };
    if (product.stock === 0) return { status: 'out', color: 'orange', label: 'Rupture' };
    if (product.stock <= product.stockAlert) return { status: 'low', color: 'orange', label: 'Stock faible' };
    return { status: 'ok', color: 'green', label: 'En stock' };
  };

  const getPrice = (product) => {
    return pricingType === 'T2' && product.priceHT_T2 ? product.priceHT_T2 : product.priceHT;
  };

  const handleQuantityChange = (productId, field, value) => {
    setCart(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const addToCart = (product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: {
        quantity: 1,
        quantityPromo: 0,
        quantityOrdered: 1,
        product
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

  const calculateFinancials = () => {
    const items = Object.values(cart);
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;
    let totalMargin = 0;
    let totalCessionPrice = 0;
    let totalPromoRevenue = 0;
    let totalWeight = 0;
    let totalPackages = 0;

    items.forEach(item => {
      const product = item.product;
      const quantity = item.quantity || 0;
      const quantityPromo = item.quantityPromo || 0;
      const priceHT = getPrice(product);
      const tvaRate = product.tvaRate || 5.5;

      // Totaux HT/TVA/TTC
      const itemHT = priceHT * quantity;
      const itemTVA = itemHT * (tvaRate / 100);
      const itemTTC = itemHT + itemTVA;

      totalHT += itemHT;
      totalTVA += itemTVA;
      totalTTC += itemTTC;

      // Marge
      if (product.cessionPrice) {
        const marginAmount = (priceHT - product.cessionPrice) * quantity;
        totalMargin += marginAmount;
        totalCessionPrice += product.cessionPrice * quantity;
      } else if (product.margin) {
        totalMargin += (priceHT * (product.margin / 100)) * quantity;
      }

      // CA promotionnel
      if (quantityPromo > 0) {
        const promoPrice = priceHT * (1 - (product.margin || 0) / 100);
        totalPromoRevenue += promoPrice * quantityPromo;
      }

      // Poids (approximation)
      const weightPerUnit = product.packaging === 'KG' ? 1 : 
                           product.packaging === 'UC' ? 5 : 
                           product.packaging === 'BAR' ? 2 : 1;
      totalWeight += quantity * weightPerUnit;
    });

    totalPackages = Math.ceil(totalWeight / 20); // 20 kg par colis
    const totalMarginPercent = totalCessionPrice > 0 
      ? (totalMargin / totalCessionPrice) * 100 
      : 0;
    const promoRevenuePercent = totalTTC > 0 
      ? (totalPromoRevenue / totalTTC) * 100 
      : 0;

    setFinancials({
      totalPackages,
      totalWeight: Math.round(totalWeight * 100) / 100,
      totalHT: Math.round(totalHT * 100) / 100,
      totalTVA: Math.round(totalTVA * 100) / 100,
      totalTTC: Math.round(totalTTC * 100) / 100,
      totalMargin: Math.round(totalMargin * 100) / 100,
      totalMarginPercent: Math.round(totalMarginPercent * 100) / 100,
      promoRevenue: Math.round(totalPromoRevenue * 100) / 100,
      promoRevenuePercent: Math.round(promoRevenuePercent * 100) / 100
    });
  };

  const handleSubmitOrder = async () => {
    const items = Object.entries(cart).map(([productId, item]) => ({
      productId,
      quantity: item.quantity || 0,
      quantityPromo: item.quantityPromo || 0,
      quantityOrdered: item.quantityOrdered || item.quantity || 0
    })).filter(item => item.quantity > 0);

    if (items.length === 0) {
      toast.error('Veuillez ajouter au moins un produit à la commande');
      return;
    }

    try {
      const response = await api.post('/orders', {
        items,
        orderDate,
        deliveryDate,
        grouping,
        department: 'Fruits et Légumes',
        pricingType
      });

      if (response.data.success) {
        toast.success('Commande créée avec succès');
        setCart({});
        navigate('/client/orders');
      }
    } catch (error) {
      toast.error('Erreur lors de la création de la commande');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="professional-order">
      {/* Bandeau contextuel supérieur */}
      <div className="order-context-bar">
        <div className="context-item">
          <span className="label">Date et heure :</span>
          <span className="value">{new Date().toLocaleString('fr-FR')}</span>
        </div>
        {context?.deadline && (
          <div className="context-item">
            <span className="label">Heure limite :</span>
            <span className={`value ${context.deadline.isPast ? 'past' : ''}`}>
              {String(context.deadline.hour).padStart(2, '0')}:
              {String(context.deadline.minute).padStart(2, '0')}
              {!context.deadline.isPast && ` (${context.deadline.timeRemainingFormatted})`}
            </span>
          </div>
        )}
        {context?.weather && (
          <div className="context-item">
            <span className="label">Météo :</span>
            <span className="value">{context.weather.icon} {context.weather.condition}</span>
          </div>
        )}
        {context?.messages && context.messages.length > 0 && (
          <div className="context-item messages">
            {context.messages.map(msg => (
              <div key={msg.id} className={`message ${msg.type}`}>
                {msg.title}: {msg.content}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* En-tête de commande */}
      <div className="order-header">
        <h1>Commande Fruits & Légumes</h1>
        <div className="order-fields">
          <div className="field">
            <label>Date de commande :</label>
            <input 
              type="date" 
              value={orderDate} 
              onChange={(e) => setOrderDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Date de livraison :</label>
            <input 
              type="date" 
              value={deliveryDate} 
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Regroupement :</label>
            <input 
              type="text" 
              value={grouping} 
              onChange={(e) => setGrouping(e.target.value)}
              placeholder="Positionnement"
            />
          </div>
          <div className="field">
            <label>Rayon :</label>
            <span className="department">Fruits et Légumes</span>
          </div>
        </div>
      </div>

      <div className="order-content">
        {/* Colonne principale - Liste des produits */}
        <div className="products-section">
          {/* Filtres et recherche */}
          <div className="filters-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Rechercher par produit, code, libellé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-buttons">
              <button onClick={fetchProducts} className="btn-refresh">Actualiser</button>
              <button className="btn-ardoise">Ardoise</button>
              <div className="pricing-toggle">
                <button 
                  className={pricingType === 'T1' ? 'active' : ''}
                  onClick={() => setPricingType('T1')}
                >
                  T1
                </button>
                <button 
                  className={pricingType === 'T2' ? 'active' : ''}
                  onClick={() => setPricingType('T2')}
                >
                  T2
                </button>
              </div>
            </div>
          </div>

          {/* Tableau des produits */}
          <div className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Libellé produit</th>
                  <th>Origine</th>
                  <th>Conditionnement</th>
                  <th>Qté/Cond.</th>
                  <th>Prix cession</th>
                  <th>Marge (%)</th>
                  <th>Qté promo</th>
                  <th>Qté demandée</th>
                  <th>Qté commandée</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const stockStatus = getStockStatus(product);
                  const price = getPrice(product);
                  const inCart = cart[product.id];
                  
                  return (
                    <tr 
                      key={product.id}
                      className={`product-row ${stockStatus.status}`}
                    >
                      <td>{product.name}</td>
                      <td>{product.origin || '-'}</td>
                      <td>{product.packaging || product.unit || '-'}</td>
                      <td>1</td>
                      <td>{formatPrice(product.cessionPrice || price)}</td>
                      <td>
                        {product.cessionPrice 
                          ? `${((price - product.cessionPrice) / product.cessionPrice * 100).toFixed(1)}%`
                          : product.margin ? `${product.margin}%` : '-'
                        }
                      </td>
                      <td>
                        {inCart ? (
                          <input
                            type="number"
                            min="0"
                            value={inCart.quantityPromo || 0}
                            onChange={(e) => handleQuantityChange(product.id, 'quantityPromo', e.target.value)}
                            className="qty-input"
                          />
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td>
                        {inCart ? (
                          <input
                            type="number"
                            min="0"
                            value={inCart.quantity || 0}
                            onChange={(e) => handleQuantityChange(product.id, 'quantity', e.target.value)}
                            className="qty-input"
                          />
                        ) : (
                          <button onClick={() => addToCart(product)} className="btn-add">
                            Ajouter
                          </button>
                        )}
                      </td>
                      <td>
                        {inCart ? (
                          <input
                            type="number"
                            min="0"
                            value={inCart.quantityOrdered || inCart.quantity || 0}
                            onChange={(e) => handleQuantityChange(product.id, 'quantityOrdered', e.target.value)}
                            className="qty-input"
                          />
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td>
                        <span className={`stock-badge ${stockStatus.status}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td>
                        {inCart && (
                          <button 
                            onClick={() => removeFromCart(product.id)}
                            className="btn-remove"
                          >
                            Retirer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne droite - Indicateurs financiers */}
        <div className="financials-panel">
          <h3>Indicateurs Financiers</h3>
          <div className="financial-item">
            <span className="label">Nombre de colis :</span>
            <span className="value">{financials.totalPackages}</span>
          </div>
          <div className="financial-item">
            <span className="label">Poids :</span>
            <span className="value">{financials.totalWeight} kg</span>
          </div>
          <div className="financial-item">
            <span className="label">PVC :</span>
            <span className="value">{formatPrice(financials.totalTTC)}</span>
          </div>
          <div className="financial-item">
            <span className="label">Marge (€) :</span>
            <span className="value">{formatPrice(financials.totalMargin)}</span>
          </div>
          <div className="financial-item">
            <span className="label">Marge (%) :</span>
            <span className="value">{financials.totalMarginPercent.toFixed(2)}%</span>
          </div>
          <div className="financial-item">
            <span className="label">Part promo en CA (%) :</span>
            <span className="value">{financials.promoRevenuePercent.toFixed(2)}%</span>
          </div>
          
          <div className="totals-section">
            <div className="total-item">
              <span>Total HT :</span>
              <span>{formatPrice(financials.totalHT)}</span>
            </div>
            <div className="total-item">
              <span>TVA :</span>
              <span>{formatPrice(financials.totalTVA)}</span>
            </div>
            <div className="total-item total-ttc">
              <span>Total TTC :</span>
              <span>{formatPrice(financials.totalTTC)}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-cart">Mon panier</button>
            <button className="btn-confirm" onClick={handleSubmitOrder}>
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalOrder;
