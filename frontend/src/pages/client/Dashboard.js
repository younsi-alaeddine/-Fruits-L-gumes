import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { getServerBaseURL } from '../../services/api';
import { toast } from 'react-toastify';
import CategoryFilters from '../../components/CategoryFilters';
import './ClientDashboard.css';

const ClientDashboard = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('TOUS');
  const [selectedSubCategory, setSelectedSubCategory] = useState('TOUS');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoriesConfig, setCategoriesConfig] = useState(null);
  const [sortBy, setSortBy] = useState('promotions-first'); // Par défaut : promotions en premier
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersStats, setOrdersStats] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const productsPerPage = 12;

  useEffect(() => {
    fetchProducts();
    fetchOrdersStats();
    fetchCategoriesConfig();
    fetchPromotions();
  }, []);

  const fetchCategoriesConfig = async () => {
    try {
      const response = await api.get('/products/categories');
      if (response.data.success) {
        setCategoriesConfig(response.data.categories);
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const fetchPromotions = async () => {
    try {
      const response = await api.get('/promotions?isActive=true');
      if (response.data.success) {
        setPromotions(response.data.promotions || []);
      }
    } catch (error) {
      console.error('Erreur chargement promotions:', error);
    }
  };

  // Vérifier si un produit est en promotion
  const getProductPromotion = (product) => {
    const now = new Date();
    return promotions.find(promo => {
      if (!promo.isActive) return false;
      const validFrom = new Date(promo.validFrom);
      const validTo = new Date(promo.validTo);
      if (now < validFrom || now > validTo) return false;
      
      // Vérifier si la promotion s'applique à ce produit
      if (promo.appliesTo === 'ALL_PRODUCTS') return true;
      if (promo.appliesTo === 'SPECIFIC_PRODUCTS' && promo.productIds?.includes(product.id)) return true;
      if (promo.appliesTo === 'CATEGORY' && promo.productIds?.includes(product.categoryId || product.category)) return true;
      return false;
    });
  };

  // Calculer le prix TTC avec promotion
  const getPromotionalPrice = (product, promotion) => {
    if (!promotion) return null;
    
    const priceTTC = product.priceHT * (1 + (product.tvaRate || 5.5) / 100);
    
    if (promotion.type === 'PERCENTAGE') {
      const discount = priceTTC * (promotion.value / 100);
      const maxDiscount = promotion.maxDiscount || Infinity;
      const finalDiscount = Math.min(discount, maxDiscount);
      return Math.max(0, priceTTC - finalDiscount);
    } else if (promotion.type === 'FIXED_AMOUNT') {
      return Math.max(0, priceTTC - promotion.value);
    }
    
    return priceTTC;
  };

  useEffect(() => {
    setCurrentPage(1); // Reset à la page 1 quand on change de filtre
  }, [selectedCategory, selectedSubCategory, searchTerm, sortBy]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      // Gérer la nouvelle structure paginée ou l'ancienne structure
      if (response.data.success && response.data.products) {
        setProducts(response.data.products);
      } else if (response.data.products) {
        setProducts(response.data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      toast.error('Erreur lors du chargement des produits');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersStats = async () => {
    try {
      const response = await api.get('/orders');
      const orders = response.data.orders || [];
      const stats = {
        totalOrders: orders.length,
        totalAmount: orders.reduce((sum, o) => sum + o.totalTTC, 0),
        pendingOrders: orders.filter(o => ['NEW', 'PREPARATION', 'LIVRAISON'].includes(o.status)).length
      };
      setOrdersStats(stats);
    } catch (error) {
      // Ignorer l'erreur si pas de commandes
    }
  };

  // Grouper les produits par catégorie
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || 'FRUITS';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});

  // Obtenir les catégories disponibles
  const categories = ['TOUS', ...Object.keys(productsByCategory)];

  // Filtrer et trier les produits avec promotions
  let filteredProducts = (selectedCategory === 'TOUS' 
    ? products 
    : productsByCategory[selectedCategory] || [])
    .map(product => {
      const promotion = getProductPromotion(product);
      const promotionalPrice = promotion ? getPromotionalPrice(product, promotion) : null;
      const originalPriceTTC = product.priceHT * (1 + (product.tvaRate || 5.5) / 100);
      return {
        ...product,
        promotion,
        promotionalPrice,
        hasPromotion: !!promotion,
        originalPriceTTC
      };
    })
    .filter(product => {
      // Filtre par recherche
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // Filtre par sous-catégorie
      if (selectedCategory !== 'TOUS' && selectedSubCategory !== 'TOUS') {
        if (product.subCategory !== selectedSubCategory) {
          return false;
        }
      }
      return true;
    });

  // Tri avec promotions en premier
  filteredProducts = [...filteredProducts].sort((a, b) => {
    // Toujours mettre les promos en premier (par défaut)
    if (sortBy === 'promotions-first' || sortBy === 'default') {
      if (a.hasPromotion && !b.hasPromotion) return -1;
      if (!a.hasPromotion && b.hasPromotion) return 1;
    }
    
    switch (sortBy) {
      case 'promotions-first':
      case 'default':
        // Si les deux ont des promotions ou non, trier par nom
        return a.name.localeCompare(b.name);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-asc':
        return (a.promotionalPrice || a.priceHT) - (b.promotionalPrice || b.priceHT);
      case 'price-desc':
        return (b.promotionalPrice || b.priceHT) - (a.promotionalPrice || a.priceHT);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  const getCategoryLabel = (category) => {
    if (!categoriesConfig || !categoriesConfig[category]) {
      const labels = {
        'TOUS': 'Tous les produits',
        'FRUITS': '🍎 Fruits',
        'LEGUMES': '🥬 Légumes',
        'HERBES': '🌿 Herbes aromatiques',
        'FRUITS_SECS': '🥜 Fruits secs'
      };
      return labels[category] || category;
    }
    return `${categoriesConfig[category].icon} ${categoriesConfig[category].name}`;
  };

  const toggleProduct = (productId) => {
    setCart(prev => {
      if (prev[productId]) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      } else {
        return { ...prev, [productId]: 1 };
      }
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = Math.max(0.1, currentQty + delta);
      if (newQty <= 0) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      return { ...prev, [productId]: Math.round(newQty * 10) / 10 };
    });
  };

  const setQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCart(prev => {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      });
    } else {
      setCart(prev => ({ ...prev, [productId]: Math.round(quantity * 10) / 10 }));
    }
  };

  const quickAddQuantity = (productId, amount) => {
    const currentQty = cart[productId] || 0;
    setQuantity(productId, currentQty + amount);
  };

  const getCartItems = () => {
    return products
      .filter(p => cart[p.id])
      .map(product => ({
        ...product,
        quantity: cart[product.id]
      }));
  };

  const calculateCartTotals = () => {
    const items = getCartItems();
    const totalHT = items.reduce((sum, item) => sum + (item.priceHT * item.quantity), 0);
    const totalTVA = items.reduce((sum, item) => {
      const tvaAmount = item.priceHT * (item.tvaRate / 100) * item.quantity;
      return sum + tvaAmount;
    }, 0);
    const totalTTC = totalHT + totalTVA;
    return { totalHT, totalTVA, totalTTC };
  };

  const calculateCartTotal = () => {
    return calculateCartTotals().totalTTC;
  };

  const handleSubmitOrder = async () => {
    const items = getCartItems();
    
    if (items.length === 0) {
      toast.warning('Votre panier est vide');
      return;
    }

    setSubmitting(true);

    try {
      const orderItems = items.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }));

      const response = await api.post('/orders', { items: orderItems });
      
      // Message simple sans détails de stock
      toast.success('Commande créée avec succès ! Votre commande sera préparée et livrée prochainement.');
      
      setCart({});
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return <div className="loading">Chargement des produits...</div>;
  }

  const cartItems = getCartItems();
  const cartTotals = calculateCartTotals();
  const cartTotal = cartTotals.totalTTC;

  return (
    <div className="client-dashboard">
      <div className="dashboard-header">
        <h1>🍎 Catalogue Produits</h1>
        {ordersStats && (
          <div className="quick-stats">
            <div className="quick-stat-item">
              <span className="quick-stat-label">Mes commandes</span>
              <span className="quick-stat-value">{ordersStats.totalOrders}</span>
            </div>
            <div className="quick-stat-item">
              <span className="quick-stat-label">Total dépensé</span>
              <span className="quick-stat-value">{formatPrice(ordersStats.totalAmount)}</span>
            </div>
            {ordersStats.pendingOrders > 0 && (
              <div className="quick-stat-item highlight">
                <span className="quick-stat-label">En cours</span>
                <span className="quick-stat-value">{ordersStats.pendingOrders}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recherche et filtres */}
      <div className="search-and-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters-row">
          <CategoryFilters
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            onCategoryChange={setSelectedCategory}
            onSubCategoryChange={setSelectedSubCategory}
            showSubCategories={true}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="promotions-first">🔥 Promotions en premier</option>
            <option value="name-asc">Trier par nom (A-Z)</option>
            <option value="name-desc">Trier par nom (Z-A)</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {/* Résumé produits */}
      <div className="products-summary">
        <span>
          {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
          {searchTerm || selectedCategory !== 'TOUS' ? ` (sur ${products.length})` : ''}
        </span>
        {cartItems.length > 0 && (
          <span className="cart-indicator">
            🛒 {cartItems.length} produit{cartItems.length > 1 ? 's' : ''} dans le panier
          </span>
        )}
      </div>

      {/* Section Promotions en vedette */}
      {filteredProducts.filter(p => p.hasPromotion).length > 0 && (
        <div className="promotions-banner">
          <div className="promotions-header">
            <h2>🔥 PROMOTIONS EN VEDETTE</h2>
            <p>Découvrez nos offres spéciales !</p>
          </div>
        </div>
      )}

      {/* Liste des produits */}
      {paginatedProducts.length === 0 ? (
        <div className="no-products">
          <p>🔍 Aucun produit trouvé</p>
          {(searchTerm || selectedCategory !== 'TOUS' || selectedSubCategory !== 'TOUS') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('TOUS');
                setSelectedSubCategory('TOUS');
              }}
              className="btn btn-secondary"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <>
              <div className="products-grid">
            {paginatedProducts.map(product => {
              const isInCart = !!cart[product.id];
              const quantity = cart[product.id] || 0;
              const priceTTC = product.priceHT * (1 + product.tvaRate / 100);
              const hasPromotion = product.hasPromotion;
              const promotion = product.promotion;
              const promotionalPrice = product.promotionalPrice;
              const originalPriceTTC = product.originalPriceTTC;
              const discountPercent = promotion && promotion.type === 'PERCENTAGE' 
                ? promotion.value 
                : promotionalPrice && originalPriceTTC
                  ? Math.round(((originalPriceTTC - promotionalPrice) / originalPriceTTC) * 100)
                  : 0;
              const displayPrice = hasPromotion && promotionalPrice ? promotionalPrice : priceTTC;
              
              return (
                <div key={product.id} className={`product-card ${isInCart ? 'in-cart' : ''} ${hasPromotion ? 'product-promotion' : ''}`}>
                  {hasPromotion && (
                    <div className="promotion-badge">
                      <span className="promotion-icon">🔥</span>
                      <span className="promotion-text">
                        {discountPercent > 0 ? `-${discountPercent}%` : 'PROMO'}
                      </span>
                    </div>
                  )}
                  {product.photoUrl && (
                    <div className="product-image">
                      <img
                        src={`${getServerBaseURL()}${product.photoUrl}`}
                        alt={product.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.style.backgroundColor = '#f0f0f0';
                          e.target.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">Pas d\'image</div>';
                        }}
                      />
                    </div>
                  )}
                  <div className="product-info">
                    <div className="product-header">
                      <h3>{product.name}</h3>
                      {product.subCategory && categoriesConfig && categoriesConfig[product.category]?.subCategories?.[product.subCategory] && (
                        <span className="product-subcategory-badge" title={categoriesConfig[product.category].subCategories[product.subCategory].name}>
                          {categoriesConfig[product.category].subCategories[product.subCategory].icon}
                        </span>
                      )}
                    </div>
                    <div className="product-category-info">
                      <span className="product-category-badge">
                        {getCategoryLabel(product.category || 'FRUITS')}
                      </span>
                    </div>
                    <div className="product-prices">
                      {hasPromotion && promotionalPrice ? (
                        <>
                          <span className="price-ttc promotional">{formatPrice(promotionalPrice)} TTC</span>
                          <span className="price-ht original strikethrough">{formatPrice(originalPriceTTC)}</span>
                          {promotion && (
                            <span className="promotion-name">🎁 {promotion.name}</span>
                          )}
                        </>
                      ) : (
                        <>
                      <span className="price-ht">{formatPrice(product.priceHT)} HT</span>
                      <span className="price-ttc">{formatPrice(priceTTC)} TTC</span>
                      <span className="tva">TVA {product.tvaRate}%</span>
                        </>
                      )}
                    </div>
                    <div className="product-unit">Unité : {product.unit}</div>

                    {!isInCart ? (
                      <div className="add-to-cart-section">
                        <button
                          className="btn btn-primary btn-add-to-cart"
                          onClick={() => {
                            setCart(prev => ({ ...prev, [product.id]: 1 }));
                            toast.success(`${product.name} ajouté au panier`);
                          }}
                        >
                          🛒 Ajouter au panier
                        </button>
                        <div className="quick-quantity-buttons">
                          <button
                            className="btn-quick-qty"
                            onClick={() => {
                              setCart(prev => ({ ...prev, [product.id]: 0.5 }));
                              toast.info(`${product.name} : 0.5 ${product.unit} ajouté`);
                            }}
                            title="Ajouter 0.5"
                          >
                            0.5
                          </button>
                          <button
                            className="btn-quick-qty"
                            onClick={() => {
                              setCart(prev => ({ ...prev, [product.id]: 1 }));
                              toast.info(`${product.name} : 1 ${product.unit} ajouté`);
                            }}
                            title="Ajouter 1"
                          >
                            1
                          </button>
                          <button
                            className="btn-quick-qty"
                            onClick={() => {
                              setCart(prev => ({ ...prev, [product.id]: 2 }));
                              toast.info(`${product.name} : 2 ${product.unit} ajouté`);
                            }}
                            title="Ajouter 2"
                          >
                            2
                          </button>
                          <button
                            className="btn-quick-qty"
                            onClick={() => {
                              setCart(prev => ({ ...prev, [product.id]: 5 }));
                              toast.info(`${product.name} : 5 ${product.unit} ajouté`);
                            }}
                            title="Ajouter 5"
                          >
                            5
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="product-quantity-section">
                        <div className="quantity-label">Quantité :</div>
                        <div className="product-quantity-controls">
                          <button
                            onClick={() => {
                              const newQty = Math.max(0, quantity - 0.5);
                              setQuantity(product.id, newQty);
                              if (newQty === 0) {
                                toast.info(`${product.name} retiré du panier`);
                              }
                            }}
                            className="btn-quantity btn-quantity-minus"
                            disabled={quantity <= 0}
                            title="Diminuer de 0.5"
                          >
                            −0.5
                          </button>
                          <button
                            onClick={() => {
                              const newQty = Math.max(0, quantity - 0.1);
                              setQuantity(product.id, newQty);
                              if (newQty === 0) {
                                toast.info(`${product.name} retiré du panier`);
                              }
                            }}
                            className="btn-quantity btn-quantity-minus-small"
                            disabled={quantity <= 0.1}
                            title="Diminuer de 0.1"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={quantity.toFixed(1)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setQuantity(product.id, val);
                            }}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (val <= 0) {
                                setQuantity(product.id, 0);
                              } else {
                                setQuantity(product.id, val);
                              }
                            }}
                            min="0"
                            step="0.1"
                            className="quantity-input"
                            title={`Quantité en ${product.unit}`}
                          />
                          <span className="quantity-unit-display">{product.unit}</span>
                          <button
                            onClick={() => updateQuantity(product.id, 0.1)}
                            className="btn-quantity btn-quantity-plus-small"
                            title="Augmenter de 0.1"
                          >
                            +
                          </button>
                          <button
                            onClick={() => updateQuantity(product.id, 0.5)}
                            className="btn-quantity btn-quantity-plus"
                            title="Augmenter de 0.5"
                          >
                            +0.5
                          </button>
                        </div>
                        <div className="quantity-total-price">
                          <span className="qty-total-label">Total :</span>
                          <span className="qty-total-value">{formatPrice(priceTTC * quantity)}</span>
                        </div>
                        <button
                          onClick={() => {
                            setCart(prev => {
                              const newCart = { ...prev };
                              delete newCart[product.id];
                              return newCart;
                            });
                            toast.info(`${product.name} retiré du panier`);
                          }}
                          className="btn-remove-from-cart"
                          title="Retirer du panier"
                        >
                          🗑️ Retirer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Précédent
              </button>
              <span className="pagination-info">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}

      {/* Bouton flottant panier */}
      {cartItems.length > 0 && (
        <button
          onClick={() => setShowCartModal(true)}
          className="cart-float-button"
          title="Voir le panier"
        >
          <span className="cart-icon">🛒</span>
          <span className="cart-count">{cartItems.length}</span>
          <span className="cart-total-float">{formatPrice(cartTotal)}</span>
        </button>
      )}

      {/* Modal panier */}
      {showCartModal && cartItems.length > 0 && (
        <>
          <div className="cart-modal-overlay" onClick={() => setShowCartModal(false)}></div>
          <div className="cart-modal">
            <div className="cart-header">
              <h2>🛒 Panier ({cartItems.length} produit{cartItems.length > 1 ? 's' : ''})</h2>
              <div className="cart-header-actions">
                <button
                  onClick={() => {
                    if (window.confirm('Vider le panier ?')) {
                      setCart({});
                      setShowCartModal(false);
                    }
                  }}
                  className="btn-clear-cart"
                  title="Vider le panier"
                >
                  🗑️ Vider
                </button>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="btn-close-cart"
                  title="Fermer"
                >
                  ×
                </button>
              </div>
            </div>
          <div className="cart-items">
            {cartItems.map(item => {
              const priceTTC = item.priceHT * (1 + item.tvaRate / 100);
              const itemTotalHT = item.priceHT * item.quantity;
              const itemTotalTVA = itemTotalHT * (item.tvaRate / 100);
              const itemTotalTTC = priceTTC * item.quantity;
              return (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-main">
                    <span className="cart-item-name">{item.name}</span>
                    <div className="cart-item-quantity-controls">
                      <button
                        onClick={() => {
                          const newQty = Math.max(0, item.quantity - 0.5);
                          setQuantity(item.id, newQty);
                          if (newQty === 0) {
                            toast.info(`${item.name} retiré du panier`);
                          }
                        }}
                        className="btn-cart-qty"
                        disabled={item.quantity <= 0}
                        title="Diminuer de 0.5"
                      >
                        −0.5
                      </button>
                      <button
                        onClick={() => {
                          const newQty = Math.max(0, item.quantity - 0.1);
                          setQuantity(item.id, newQty);
                          if (newQty === 0) {
                            toast.info(`${item.name} retiré du panier`);
                          }
                        }}
                        className="btn-cart-qty btn-cart-qty-small"
                        disabled={item.quantity <= 0.1}
                        title="Diminuer de 0.1"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.quantity.toFixed(1)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setQuantity(item.id, val);
                        }}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          if (val <= 0) {
                            setQuantity(item.id, 0);
                          } else {
                            setQuantity(item.id, val);
                          }
                        }}
                        min="0"
                        step="0.1"
                        className="cart-quantity-input"
                        title={`Quantité en ${item.unit}`}
                      />
                      <span className="cart-quantity-unit">{item.unit}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 0.1)}
                        className="btn-cart-qty btn-cart-qty-small"
                        title="Augmenter de 0.1"
                      >
                        +
                      </button>
                      <button
                        onClick={() => updateQuantity(item.id, 0.5)}
                        className="btn-cart-qty"
                        title="Augmenter de 0.5"
                      >
                        +0.5
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-price-detail">
                      <span className="price-label">Prix unitaire:</span>
                      <span>{formatPrice(priceTTC)} TTC</span>
                    </div>
                    <div className="cart-item-price-detail">
                      <span className="price-label">HT:</span>
                      <span>{formatPrice(itemTotalHT)}</span>
                    </div>
                    <div className="cart-item-price-detail">
                      <span className="price-label">TVA:</span>
                      <span>{formatPrice(itemTotalTVA)}</span>
                    </div>
                    <div className="cart-item-price-detail total">
                      <span className="price-label">Total TTC:</span>
                      <span className="cart-item-price">{formatPrice(itemTotalTTC)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCart(prev => {
                        const newCart = { ...prev };
                        delete newCart[item.id];
                        return newCart;
                      });
                      toast.info(`${item.name} retiré du panier`);
                    }}
                    className="btn-remove-item"
                    title="Retirer du panier"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <div className="cart-totals">
            <div className="cart-total-row">
              <span>Total HT :</span>
              <span>{formatPrice(cartTotals.totalHT)}</span>
            </div>
            <div className="cart-total-row">
              <span>Total TVA :</span>
              <span>{formatPrice(cartTotals.totalTVA)}</span>
            </div>
            <div className="cart-total-row cart-total-final">
              <span>Total TTC :</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
          </div>
            <button
              onClick={async () => {
                await handleSubmitOrder();
                setShowCartModal(false);
              }}
              className="btn btn-primary btn-submit-order"
              disabled={submitting}
            >
              {submitting ? '⏳ Validation...' : '✅ VALIDER LA COMMANDE'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ClientDashboard;

