import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import CategoryFilters from '../../components/CategoryFilters';
import './ClientCatalog.css';

const ClientCatalog = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TOUS');
  const [selectedSubCategory, setSelectedSubCategory] = useState('TOUS');
  const [sortBy, setSortBy] = useState('promotions-first'); // Par défaut : promos en premier
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    fetchProducts();
    fetchPromotions();
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      if (response.data.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
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

  const addToCart = (product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: {
        ...product,
        quantity: (prev[product.id]?.quantity || 0) + 1
      }
    }));
    toast.success(`${product.name} ajouté au panier`);
  };

  // Vérifier si un produit est en promotion
  const getProductPromotion = (product) => {
    const now = new Date();
    return promotions.find(promo => {
      const validFrom = new Date(promo.validFrom);
      const validTo = new Date(promo.validTo);
      return (
        promo.isActive &&
        now >= validFrom &&
        now <= validTo &&
        (promo.appliesTo === 'ALL_PRODUCTS' || 
         (promo.appliesTo === 'SPECIFIC_PRODUCTS' && promo.productIds?.includes(product.id)) ||
         (promo.appliesTo === 'CATEGORY' && promo.productIds?.includes(product.category)))
      );
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

  const filteredProducts = products
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
      if (selectedCategory !== 'TOUS' && product.category !== selectedCategory) return false;
      if (selectedSubCategory !== 'TOUS' && product.subCategory !== selectedSubCategory) return false;
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price || 0);
  };

  const cartCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="client-catalog">
      <div className="catalog-header">
        <h1>🛒 Catalogue de Produits</h1>
        <button className="btn-cart" onClick={() => navigate('/client/cart')}>
          🛒 Panier ({cartCount})
        </button>
      </div>

      <div className="catalog-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <CategoryFilters
          selectedCategory={selectedCategory}
          selectedSubCategory={selectedSubCategory}
          onCategoryChange={setSelectedCategory}
          onSubCategoryChange={setSelectedSubCategory}
        />
        <div className="view-controls">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="promotions-first">🔥 Promotions en premier</option>
            <option value="name-asc">Nom (A-Z)</option>
            <option value="name-desc">Nom (Z-A)</option>
            <option value="price-asc">Prix (Croissant)</option>
            <option value="price-desc">Prix (Décroissant)</option>
          </select>
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              ⏹️
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
          </div>
        </div>
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

      <div className={`products-container ${viewMode}`}>
        {loading ? (
          <div className="loading">Chargement...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-products">Aucun produit trouvé</div>
        ) : (
          filteredProducts.map(product => {
            const hasPromotion = product.hasPromotion;
            const promotion = product.promotion;
            const promotionalPrice = product.promotionalPrice;
            const originalPriceTTC = product.originalPriceTTC;
            const discountPercent = promotion && promotion.type === 'PERCENTAGE' 
              ? promotion.value 
              : promotionalPrice && originalPriceTTC
                ? Math.round(((originalPriceTTC - promotionalPrice) / originalPriceTTC) * 100)
                : 0;

            return (
              <div 
                key={product.id} 
                className={`product-card ${hasPromotion ? 'product-promotion' : ''}`}
              >
                {hasPromotion && (
                  <div className="promotion-badge">
                    <span className="promotion-icon">🔥</span>
                    <span className="promotion-text">
                      {discountPercent > 0 ? `-${discountPercent}%` : 'PROMO'}
                    </span>
                  </div>
                )}
                <div className="product-image">
                  {product.photo ? (
                    <img
                      src={`${api.defaults.baseURL || ''}/uploads/products/${product.photo}`}
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="no-image">📦</div>
                  )}
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <div className="product-pricing">
                    {hasPromotion && promotionalPrice ? (
                      <>
                        <p className="product-price promotional">
                          {formatPrice(promotionalPrice)} / {product.unit}
                        </p>
                        <p className="product-price original">
                          <span className="strikethrough">{formatPrice(originalPriceTTC)}</span>
                        </p>
                        {promotion && (
                          <p className="promotion-name">🎁 {promotion.name}</p>
                        )}
                      </>
                    ) : (
                      <p className="product-price">{formatPrice(product.priceHT)} / {product.unit}</p>
                    )}
                  </div>
                  {product.stock <= 0 && (
                    <span className="stock-badge out">Rupture de stock</span>
                  )}
                  {product.stock > 0 && product.stock <= product.stockAlert && (
                    <span className="stock-badge low">Stock faible</span>
                  )}
                </div>
                <div className="product-actions">
                  <button
                    className={`btn-add-cart ${hasPromotion ? 'btn-promotion' : ''}`}
                    onClick={() => addToCart(product)}
                    disabled={product.stock <= 0}
                  >
                    {hasPromotion ? '🔥' : '➕'} Ajouter au panier
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ClientCatalog;
