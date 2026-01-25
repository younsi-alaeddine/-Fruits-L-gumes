import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './ProfessionalOrder.css';

const ProfessionalOrderEnhanced = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState(null);
  
  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TOUS');
  const [pricingType, setPricingType] = useState('T1');
  
  // Filtres avancés
  const [activeFilters, setActiveFilters] = useState({
    all: true,
    rupture: false,
    opportunite: false,
    delaiAppro: false,
    animation: false,
    erreur: false,
    dlcLongue: false,
    dlcCourte: false,
    ajustes: false,
    dejaCommande: false,
    enCampagne: false
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(40);
  
  // Données de commande
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [grouping, setGrouping] = useState('');
  const [cart, setCart] = useState({});
  
  // Stratégie de prix
  const [initialPackages, setInitialPackages] = useState(10);
  const [minPackages, setMinPackages] = useState(7);
  const [maxPackages, setMaxPackages] = useState(13);
  const [isInAdjustment, setIsInAdjustment] = useState(false);
  
  // Indicateurs financiers (Perm/Promo/Total)
  const [financials, setFinancials] = useState({
    totalPackages: 0,
    totalWeight: 0,
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    totalMargin: 0,
    totalMarginPercent: 0,
    promoRevenue: 0,
    promoRevenuePercent: 0,
    // Perm/Promo/Total
    nbRef_Perm: 0,
    nbRef_Promo: 0,
    nbRef_Total: 0,
    nbColis_Perm: 0,
    nbColis_Promo: 0,
    nbColis_Total: 0,
    poids_Perm: 0,
    poids_Promo: 0,
    poids_Total: 0,
    PC_Perm: 0,
    PC_Promo: 0,
    PC_Total: 0,
    PVC_Perm: 0,
    PVC_Promo: 0,
    PVC_Total: 0,
    marge_Perm: 0,
    marge_Promo: 0,
    marge_Total: 0,
    margePercent_Perm: 0,
    margePercent_Promo: 0,
    margePercent_Total: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchContext();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeliveryDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    filterProducts();
    setCurrentPage(1); // Reset à la page 1 quand on change de filtre
  }, [products, searchTerm, selectedCategory, activeFilters]);

  useEffect(() => {
    calculateFinancials();
    checkAdjustment();
  }, [cart, pricingType, financials.totalPackages]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      const productsData = response.data.products || response.data.success?.products || [];
      setProducts(productsData);
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

    // Filtre par recherche (nom, gencod, barcode)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.origin && p.origin.toLowerCase().includes(searchLower)) ||
        (p.gencod && p.gencod.toLowerCase().includes(searchLower)) ||
        (p.barcode && p.barcode.includes(searchTerm))
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== 'TOUS') {
      filtered = filtered.filter(p => 
        p.category === selectedCategory || 
        p.customCategory?.name === selectedCategory
      );
    }

    // Filtres avancés
    if (!activeFilters.all) {
      if (activeFilters.rupture) {
        filtered = filtered.filter(p => p.stock === 0 || p.isBlocked);
      }
      if (activeFilters.opportunite) {
        filtered = filtered.filter(p => p.isOpportunity);
      }
      if (activeFilters.delaiAppro) {
        filtered = filtered.filter(p => p.supplyDelay && p.supplyDelay > 0);
      }
      if (activeFilters.animation) {
        filtered = filtered.filter(p => p.isInAnimation);
      }
      if (activeFilters.erreur) {
        filtered = filtered.filter(p => p.hasError);
      }
      if (activeFilters.dlcLongue) {
        filtered = filtered.filter(p => p.dlcType === 'LONGUE');
      }
      if (activeFilters.dlcCourte) {
        filtered = filtered.filter(p => p.dlcType === 'COURTE');
      }
      if (activeFilters.ajustes) {
        filtered = filtered.filter(p => p.isAdjusted);
      }
      if (activeFilters.enCampagne) {
        filtered = filtered.filter(p => p.isInCampaign);
      }
    }

    setFilteredProducts(filtered);
  };

  const handleFilterToggle = (filterName) => {
    if (filterName === 'all') {
      setActiveFilters({
        all: true,
        rupture: false,
        opportunite: false,
        delaiAppro: false,
        animation: false,
        erreur: false,
        dlcLongue: false,
        dlcCourte: false,
        ajustes: false,
        dejaCommande: false,
        enCampagne: false
      });
    } else {
      setActiveFilters(prev => ({
        ...prev,
        all: false,
        [filterName]: !prev[filterName]
      }));
    }
  };

  const getStockStatus = (product) => {
    if (product.isBlocked) return { status: 'blocked', color: 'red', label: 'Bloqué', icon: '🚫' };
    if (product.stock === 0) return { status: 'out', color: 'orange', label: 'Rupture', icon: '⚠️' };
    if (product.stock <= product.stockAlert) return { status: 'low', color: 'orange', label: 'Stock faible', icon: '📉' };
    return { status: 'ok', color: 'green', label: 'En stock', icon: '✅' };
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
    let totals = {
      perm: { ht: 0, tva: 0, ttc: 0, margin: 0, pc: 0, weight: 0, count: 0 },
      promo: { ht: 0, tva: 0, ttc: 0, margin: 0, pc: 0, weight: 0, count: 0 }
    };

    items.forEach(item => {
      const product = item.product;
      const quantity = item.quantity || 0;
      const quantityPromo = item.quantityPromo || 0;
      const quantityPerm = quantity - quantityPromo;
      const priceHT = getPrice(product);
      const tvaRate = product.tvaRate || 5.5;

      // Calculs pour produits permanents
      if (quantityPerm > 0) {
        const itemHT = priceHT * quantityPerm;
        const itemTVA = itemHT * (tvaRate / 100);
        const itemTTC = itemHT + itemTVA;
        
        totals.perm.ht += itemHT;
        totals.perm.tva += itemTVA;
        totals.perm.ttc += itemTTC;
        totals.perm.count += 1;

        if (product.cessionPrice) {
          totals.perm.margin += (priceHT - product.cessionPrice) * quantityPerm;
          totals.perm.pc += product.cessionPrice * quantityPerm;
        }

        const weightPerUnit = product.packaging === 'KG' ? 1 : 
                             product.packaging === 'UC' ? 5 : 
                             product.packaging === 'BAR' ? 2 : 1;
        totals.perm.weight += quantityPerm * weightPerUnit;
      }

      // Calculs pour produits promotionnels
      if (quantityPromo > 0) {
        const promoPrice = priceHT * 0.9; // Prix promo (exemple: -10%)
        const itemHT = promoPrice * quantityPromo;
        const itemTVA = itemHT * (tvaRate / 100);
        const itemTTC = itemHT + itemTVA;
        
        totals.promo.ht += itemHT;
        totals.promo.tva += itemTVA;
        totals.promo.ttc += itemTTC;
        totals.promo.count += 1;

        if (product.cessionPrice) {
          totals.promo.margin += (promoPrice - product.cessionPrice) * quantityPromo;
          totals.promo.pc += product.cessionPrice * quantityPromo;
        }

        const weightPerUnit = product.packaging === 'KG' ? 1 : 
                             product.packaging === 'UC' ? 5 : 
                             product.packaging === 'BAR' ? 2 : 1;
        totals.promo.weight += quantityPromo * weightPerUnit;
      }
    });

    const totalHT = totals.perm.ht + totals.promo.ht;
    const totalTVA = totals.perm.tva + totals.promo.tva;
    const totalTTC = totals.perm.ttc + totals.promo.ttc;
    const totalMargin = totals.perm.margin + totals.promo.margin;
    const totalPC = totals.perm.pc + totals.promo.pc;
    const totalWeight = totals.perm.weight + totals.promo.weight;
    const totalPackages = Math.ceil(totalWeight / 20);

    const margePercent_Perm = totals.perm.pc > 0 ? (totals.perm.margin / totals.perm.pc) * 100 : 0;
    const margePercent_Promo = totals.promo.pc > 0 ? (totals.promo.margin / totals.promo.pc) * 100 : 0;
    const margePercent_Total = totalPC > 0 ? (totalMargin / totalPC) * 100 : 0;
    const promoRevenuePercent = totalTTC > 0 ? (totals.promo.ttc / totalTTC) * 100 : 0;

    setFinancials({
      totalPackages,
      totalWeight: Math.round(totalWeight * 100) / 100,
      totalHT: Math.round(totalHT * 100) / 100,
      totalTVA: Math.round(totalTVA * 100) / 100,
      totalTTC: Math.round(totalTTC * 100) / 100,
      totalMargin: Math.round(totalMargin * 100) / 100,
      totalMarginPercent: Math.round(margePercent_Total * 100) / 100,
      promoRevenue: Math.round(totals.promo.ttc * 100) / 100,
      promoRevenuePercent: Math.round(promoRevenuePercent * 100) / 100,
      // Perm/Promo/Total
      nbRef_Perm: totals.perm.count,
      nbRef_Promo: totals.promo.count,
      nbRef_Total: totals.perm.count + totals.promo.count,
      nbColis_Perm: Math.ceil(totals.perm.weight / 20),
      nbColis_Promo: Math.ceil(totals.promo.weight / 20),
      nbColis_Total: totalPackages,
      poids_Perm: Math.round(totals.perm.weight * 100) / 100,
      poids_Promo: Math.round(totals.promo.weight * 100) / 100,
      poids_Total: Math.round(totalWeight * 100) / 100,
      PC_Perm: Math.round(totals.perm.pc * 100) / 100,
      PC_Promo: Math.round(totals.promo.pc * 100) / 100,
      PC_Total: Math.round(totalPC * 100) / 100,
      PVC_Perm: Math.round(totals.perm.ttc * 100) / 100,
      PVC_Promo: Math.round(totals.promo.ttc * 100) / 100,
      PVC_Total: Math.round(totalTTC * 100) / 100,
      marge_Perm: Math.round(totals.perm.margin * 100) / 100,
      marge_Promo: Math.round(totals.promo.margin * 100) / 100,
      marge_Total: Math.round(totalMargin * 100) / 100,
      margePercent_Perm: Math.round(margePercent_Perm * 100) / 100,
      margePercent_Promo: Math.round(margePercent_Perm * 100) / 100,
      margePercent_Total: Math.round(margePercent_Total * 100) / 100
    });
  };

  const checkAdjustment = () => {
    if (financials.totalPackages < minPackages || financials.totalPackages > maxPackages) {
      setIsInAdjustment(true);
    } else {
      setIsInAdjustment(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

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
        pricingType,
        initialPackages,
        minPackages,
        maxPackages,
        isInAdjustment
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

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    try {
      const response = await api.post('/orders/export', {
        orderDate,
        deliveryDate,
        items: Object.entries(cart).map(([productId, item]) => ({
          productId,
          ...item
        }))
      }, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `commande-${orderDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
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

      {/* Alerte d'ajustement */}
      {isInAdjustment && (
        <div className="adjustment-alert">
          <strong>⚠️ Commande en AJUSTEMENT</strong>
          <p>Initiale: {initialPackages} colis, ajustement autorisé entre {minPackages} et {maxPackages}.</p>
          <p>Nombre Colis actuel: <strong>{financials.totalPackages}</strong></p>
          {financials.totalPackages < minPackages && (
            <p className="error">⚠️ Nombre de colis inférieur au minimum autorisé !</p>
          )}
          {financials.totalPackages > maxPackages && (
            <p className="error">⚠️ Nombre de colis supérieur au maximum autorisé !</p>
          )}
        </div>
      )}

      <div className="order-content">
        {/* Colonne principale - Liste des produits */}
        <div className="products-section">
          {/* Filtres avancés */}
          <div className="advanced-filters">
            <button 
              className={activeFilters.all ? 'active' : ''}
              onClick={() => handleFilterToggle('all')}
            >
              Tous produits
            </button>
            <button 
              className={activeFilters.rupture ? 'active' : ''}
              onClick={() => handleFilterToggle('rupture')}
            >
              Rupture
            </button>
            <button 
              className={activeFilters.opportunite ? 'active' : ''}
              onClick={() => handleFilterToggle('opportunite')}
            >
              Opportu
            </button>
            <button 
              className={activeFilters.delaiAppro ? 'active' : ''}
              onClick={() => handleFilterToggle('delaiAppro')}
            >
              Délai d'Appro
            </button>
            <button 
              className={activeFilters.animation ? 'active' : ''}
              onClick={() => handleFilterToggle('animation')}
            >
              Animation
            </button>
            <button 
              className={activeFilters.erreur ? 'active' : ''}
              onClick={() => handleFilterToggle('erreur')}
            >
              Erreur
            </button>
            <button 
              className={activeFilters.dlcLongue ? 'active' : ''}
              onClick={() => handleFilterToggle('dlcLongue')}
            >
              DLC Longue
            </button>
            <button 
              className={activeFilters.dlcCourte ? 'active' : ''}
              onClick={() => handleFilterToggle('dlcCourte')}
            >
              DLC Courte
            </button>
            <button 
              className={activeFilters.ajustes ? 'active' : ''}
              onClick={() => handleFilterToggle('ajustes')}
            >
              Ajustés
            </button>
            <button 
              className={activeFilters.enCampagne ? 'active' : ''}
              onClick={() => handleFilterToggle('enCampagne')}
            >
              En campagne
            </button>
          </div>

          {/* Filtres et recherche */}
          <div className="filters-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Nº pdt, gencod, libellé..."
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
                  <th>Rupt</th>
                  <th>Pre. Ass</th>
                  <th>Libellé produit</th>
                  <th>Op.</th>
                  <th>Origine</th>
                  <th>Cond</th>
                  <th>Prés</th>
                  <th>Qté/Cond</th>
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
                {paginatedProducts.map(product => {
                  const stockStatus = getStockStatus(product);
                  const price = getPrice(product);
                  const inCart = cart[product.id];
                  
                  return (
                    <tr 
                      key={product.id}
                      className={`product-row ${stockStatus.status}`}
                    >
                      <td>
                        {product.stock === 0 || product.isBlocked ? (
                          <span className="rupture-indicator">⚠️</span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td>
                        {product.preAssigned ? (
                          <span className="pre-assigned">✓</span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td>{product.name}</td>
                      <td>
                        <span className="operation-icons">
                          {product.isInAnimation && '🎯'}
                          {product.isOpportunity && '⭐'}
                          {product.hasError && '❌'}
                        </span>
                      </td>
                      <td>{product.origin || '-'}</td>
                      <td>{product.packaging || product.unit || '-'}</td>
                      <td>{product.presentation || '-'}</td>
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
                          {stockStatus.icon} {stockStatus.label}
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

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Affichage des produits {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} sur {filteredProducts.length}
            </div>
            <div className="pagination-controls">
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="items-per-page"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
              </select>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                ‹
              </button>
              <span>Page {currentPage} sur {totalPages || 1}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Colonne droite - Indicateurs financiers */}
        <div className="financials-panel">
          <div className="action-buttons-top">
            <button onClick={() => navigate('/admin')} className="btn-dashboard">Tableau bord</button>
            <button onClick={handlePrint} className="btn-print">Imprimer</button>
            <button onClick={handleExport} className="btn-export">Exporter</button>
          </div>

          {/* Stratégie de prix */}
          <div className="pricing-strategy">
            <h4>Stratégie prix</h4>
            <div className="strategy-fields">
              <div className="field">
                <label>Initial:</label>
                <input 
                  type="number" 
                  value={initialPackages} 
                  onChange={(e) => setInitialPackages(Number(e.target.value))}
                  className="small-input"
                />
                <span>colis</span>
              </div>
              <div className="field">
                <label>Min:</label>
                <input 
                  type="number" 
                  value={minPackages} 
                  onChange={(e) => setMinPackages(Number(e.target.value))}
                  className="small-input"
                />
              </div>
              <div className="field">
                <label>Max:</label>
                <input 
                  type="number" 
                  value={maxPackages} 
                  onChange={(e) => setMaxPackages(Number(e.target.value))}
                  className="small-input"
                />
              </div>
            </div>
          </div>

          <h3>Indicateurs Financiers</h3>
          
          {/* Tableau Perm/Promo/Total */}
          <div className="financials-table">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Perm</th>
                  <th>Promo</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Nb réf</td>
                  <td>{financials.nbRef_Perm}</td>
                  <td>{financials.nbRef_Promo}</td>
                  <td><strong>{financials.nbRef_Total}</strong></td>
                </tr>
                <tr>
                  <td>Nb colis</td>
                  <td>{financials.nbColis_Perm}</td>
                  <td>{financials.nbColis_Promo}</td>
                  <td><strong>{financials.nbColis_Total}</strong></td>
                </tr>
                <tr>
                  <td>Poids</td>
                  <td>{financials.poids_Perm} kg</td>
                  <td>{financials.poids_Promo} kg</td>
                  <td><strong>{financials.poids_Total} kg</strong></td>
                </tr>
                <tr>
                  <td>PC</td>
                  <td>{formatPrice(financials.PC_Perm)}</td>
                  <td>{formatPrice(financials.PC_Promo)}</td>
                  <td><strong>{formatPrice(financials.PC_Total)}</strong></td>
                </tr>
                <tr>
                  <td>PVC</td>
                  <td>{formatPrice(financials.PVC_Perm)}</td>
                  <td>{formatPrice(financials.PVC_Promo)}</td>
                  <td><strong>{formatPrice(financials.PVC_Total)}</strong></td>
                </tr>
                <tr>
                  <td>Marge (€)</td>
                  <td>{formatPrice(financials.marge_Perm)}</td>
                  <td>{formatPrice(financials.marge_Promo)}</td>
                  <td><strong>{formatPrice(financials.marge_Total)}</strong></td>
                </tr>
                <tr>
                  <td>Marge (%)</td>
                  <td>{financials.margePercent_Perm.toFixed(2)}%</td>
                  <td>{financials.margePercent_Promo.toFixed(2)}%</td>
                  <td><strong>{financials.margePercent_Total.toFixed(2)}%</strong></td>
                </tr>
                <tr>
                  <td>Pds promo CA %</td>
                  <td>-</td>
                  <td>-</td>
                  <td><strong>{financials.promoRevenuePercent.toFixed(2)}%</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="action-buttons">
            <button className="btn-cart">Mon panier ({Object.keys(cart).length})</button>
            <button className="btn-confirm" onClick={handleSubmitOrder}>
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalOrderEnhanced;
