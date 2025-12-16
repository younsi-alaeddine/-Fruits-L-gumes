import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './AdminPreparation.css';

const Preparation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayOrders, setTodayOrders] = useState([]);
  const [productsToBuy, setProductsToBuy] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [shopFilter, setShopFilter] = useState('');
  const [shops, setShops] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'compact'
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
    productsNeeded: 0,
    totalQuantityNeeded: 0
  });

  useEffect(() => {
    fetchShops();
    fetchPreparationData();
  }, [selectedDate]);

  useEffect(() => {
    fetchPreparationData();
  }, [statusFilter, shopFilter]);

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops');
      setShops(response.data.shops || []);
    } catch (error) {
      console.error('Erreur chargement magasins:', error);
    }
  };

  const fetchPreparationData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('date', selectedDate);
      if (statusFilter) params.append('status', statusFilter);
      if (shopFilter) params.append('shopId', shopFilter);

      const ordersResponse = await api.get(`/admin/preparation?${params.toString()}`);
      
      if (ordersResponse.data.success) {
        setTodayOrders(ordersResponse.data.orders || []);
        setProductsToBuy(ordersResponse.data.productsToBuy || []);
        setStats(ordersResponse.data.stats || stats);
      }
    } catch (error) {
      console.error('Erreur chargement données préparation:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const setToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Statut de la commande mis à jour');
      fetchPreparationData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const exportProductsToBuy = () => {
    if (productsToBuy.length === 0) {
      toast.warning('Aucun produit à exporter');
      return;
    }

    const csvRows = [];
    // En-tête avec titre et date
    csvRows.push('PRODUITS À ACHETER - ' + formatDate(selectedDate + 'T00:00:00'));
    csvRows.push('');
    csvRows.push('Produit,Unité,Stock actuel,Quantité demandée,Quantité à acheter,Prix HT unitaire (€),Coût estimé (€),Nombre de commandes');
    csvRows.push('---,---,---,---,---,---,---,---');

    // Données des produits
    productsToBuy.forEach(item => {
      csvRows.push([
        `"${item.productName}"`,
        item.unit,
        item.currentStock.toFixed(1),
        item.totalRequested.toFixed(1),
        item.quantityToBuy.toFixed(1),
        item.priceHT.toFixed(2).replace('.', ','),
        (item.quantityToBuy * item.priceHT).toFixed(2).replace('.', ','),
        item.orders ? item.orders.length : 0
      ].join(','));
    });

    // Ligne de séparation
    csvRows.push('---,---,---,---,---,---,---,---');
    
    // Totaux
    const totalQuantity = productsToBuy.reduce((sum, item) => sum + item.quantityToBuy, 0);
    const totalCost = productsToBuy.reduce((sum, item) => sum + item.quantityToBuy * item.priceHT, 0);
    
    csvRows.push('');
    csvRows.push('TOTAL GÉNÉRAL,,,,' + totalQuantity.toFixed(1) + ',,' + totalCost.toFixed(2).replace('.', ',') + ',');
    csvRows.push('');
    csvRows.push('Date d\'export: ' + new Date().toLocaleString('fr-FR'));
    csvRows.push('Nombre de produits: ' + productsToBuy.length);

    const csv = csvRows.join('\n');
    const filename = `produits_a_acheter_${selectedDate.replace(/-/g, '_')}.csv`;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    toast.success('Liste exportée avec succès');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      NEW: { label: 'Nouvelle', class: 'badge-new', icon: '🆕' },
      PREPARATION: { label: 'En préparation', class: 'badge-preparation', icon: '⏳' },
      LIVRAISON: { label: 'En livraison', class: 'badge-livraison', icon: '🚚' },
      LIVREE: { label: 'Livrée', class: 'badge-livree', icon: '✅' },
      ANNULEE: { label: 'Annulée', class: 'badge-annulee', icon: '❌' }
    };
    return badges[status] || { label: status, class: 'badge-default', icon: '📋' };
  };

  const filteredOrders = todayOrders.filter(order => {
    if (statusFilter && order.status !== statusFilter) return false;
    if (shopFilter && order.shopId !== shopFilter) return false;
    return true;
  });

  const ordersByShop = filteredOrders.reduce((acc, order) => {
    const shopName = order.shop?.name || 'Inconnu';
    if (!acc[shopName]) {
      acc[shopName] = [];
    }
    acc[shopName].push(order);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des données de préparation...</p>
      </div>
    );
  }

  return (
    <div className="preparation-page">
      <div className="preparation-header">
        <div className="header-left">
          <h1>📦 Préparation des Commandes</h1>
          <p className="header-subtitle">
            {formatDate(selectedDate + 'T00:00:00')}
          </p>
        </div>
        <div className="header-actions">
          <div className="date-navigation">
            <button
              className="btn-icon"
              onClick={() => handleDateChange(-1)}
              title="Jour précédent"
            >
              ◀
            </button>
            <button
              className="btn-today"
              onClick={setToday}
              title="Aujourd'hui"
            >
              Aujourd'hui
            </button>
            <button
              className="btn-icon"
              onClick={() => handleDateChange(1)}
              title="Jour suivant"
            >
              ▶
            </button>
          </div>
          <div className="date-selector">
            <label>Date :</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-input"
            />
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="preparation-stats">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Commandes à préparer</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{formatPrice(stats.totalAmount)}</div>
            <div className="stat-label">Montant total</div>
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <div className="stat-value">{stats.productsNeeded}</div>
            <div className="stat-label">Produits à acheter</div>
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalQuantityNeeded.toFixed(1)}</div>
            <div className="stat-label">Quantité totale à acheter</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="preparation-filters">
        <div className="filter-group">
          <label>Filtrer par statut :</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Tous les statuts</option>
            <option value="NEW">Nouvelle</option>
            <option value="PREPARATION">En préparation</option>
            <option value="LIVRAISON">En livraison</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Filtrer par magasin :</label>
          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">Tous les magasins</option>
            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>
                {shop.name} - {shop.city}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Mode d'affichage :</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="filter-select"
          >
            <option value="detailed">Détaillé</option>
            <option value="compact">Compact</option>
          </select>
        </div>
      </div>

      <div className="preparation-content">
        {/* Produits à acheter */}
        {productsToBuy.length > 0 && (
          <div className="section products-to-buy-section">
            <div className="section-header">
              <div>
                <h2>🛒 Produits à Acheter</h2>
                <p className="section-subtitle">
                  {productsToBuy.length} produit(s) nécessitant un achat
                </p>
              </div>
              <div className="section-actions">
                <span className="section-badge warning">{productsToBuy.length} produit(s)</span>
                <button
                  className="btn btn-export"
                  onClick={exportProductsToBuy}
                  title="Exporter en CSV"
                >
                  📥 Exporter CSV
                </button>
              </div>
            </div>
            <div className="products-to-buy-table-container">
              <table className="products-to-buy-table">
                <thead>
                  <tr>
                    <th className="col-product">Produit</th>
                    <th className="col-unit">Unité</th>
                    <th className="col-stock">Stock actuel</th>
                    <th className="col-requested">Quantité demandée</th>
                    <th className="col-to-buy highlight-col">Quantité à acheter</th>
                    <th className="col-price">Prix HT unitaire</th>
                    <th className="col-cost highlight-col">Coût estimé</th>
                    <th className="col-orders">Commandes</th>
                  </tr>
                </thead>
                <tbody>
                  {productsToBuy.map((item, index) => (
                    <tr key={item.productId} className="product-to-buy-row" style={{ animationDelay: `${index * 0.03}s` }}>
                      <td className="col-product">
                        <strong>{item.productName}</strong>
                      </td>
                      <td className="col-unit">
                        <span className="unit-badge">{item.unit}</span>
                      </td>
                      <td className="col-stock">
                        <span className={`stock-value ${item.currentStock <= 0 ? 'zero-stock' : ''}`}>
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="col-requested">
                        <span className="requested-value">{item.totalRequested}</span>
                      </td>
                      <td className="col-to-buy highlight-cell">
                        <span className="to-buy-badge">{item.quantityToBuy}</span>
                      </td>
                      <td className="col-price">
                        <span className="price-value">{formatPrice(item.priceHT)}</span>
                      </td>
                      <td className="col-cost highlight-cell">
                        <span className="cost-value">
                          {formatPrice(item.quantityToBuy * item.priceHT)}
                        </span>
                      </td>
                      <td className="col-orders">
                        {item.orders && item.orders.length > 0 ? (
                          <span className="orders-count">{item.orders.length}</span>
                        ) : (
                          <span className="no-orders">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="total-row">
                    <td colSpan="4" className="total-label-cell">
                      <strong>Total général</strong>
                    </td>
                    <td className="total-to-buy highlight-cell">
                      <strong>
                        {productsToBuy.reduce((sum, item) => sum + item.quantityToBuy, 0).toFixed(1)}
                      </strong>
                    </td>
                    <td className="total-price">
                      <strong>—</strong>
                    </td>
                    <td className="total-cost highlight-cell">
                      <strong>
                        {formatPrice(productsToBuy.reduce((sum, item) => sum + (item.quantityToBuy * item.priceHT), 0))}
                      </strong>
                    </td>
                    <td className="total-orders">
                      <strong>—</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="total-cost-summary">
              <div className="summary-row">
                <span className="summary-label">Nombre de produits:</span>
                <span className="summary-value">{productsToBuy.length}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Quantité totale à acheter:</span>
                <span className="summary-value">
                  {productsToBuy.reduce((sum, item) => sum + item.quantityToBuy, 0).toFixed(1)}
                </span>
              </div>
              <div className="summary-row highlight">
                <span className="summary-label">Coût total estimé:</span>
                <span className="summary-value total-cost-value">
                  {formatPrice(
                    productsToBuy.reduce(
                      (sum, item) => sum + item.quantityToBuy * item.priceHT,
                      0
                    )
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Commandes à préparer */}
        <div className="section orders-section">
          <div className="section-header">
            <div>
              <h2>📋 Commandes à Préparer</h2>
              <p className="section-subtitle">
                {filteredOrders.length} commande(s) à préparer pour cette date
              </p>
            </div>
            <span className="section-badge">{filteredOrders.length} commande(s)</span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <div className="no-orders-icon">✅</div>
              <p>Aucune commande à préparer pour cette date</p>
              {statusFilter || shopFilter ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setStatusFilter('');
                    setShopFilter('');
                  }}
                >
                  Réinitialiser les filtres
                </button>
              ) : null}
            </div>
          ) : (
            <>
              {/* Vue groupée par magasin */}
              {viewMode === 'detailed' && Object.keys(ordersByShop).length > 0 && (
                <div className="orders-by-shop">
                  {Object.entries(ordersByShop).map(([shopName, orders]) => (
                    <div key={shopName} className="shop-group">
                      <h3 className="shop-group-header">
                        🏪 {shopName}
                        <span className="shop-order-count">({orders.length} commande{orders.length > 1 ? 's' : ''})</span>
                      </h3>
                      <div className="shop-orders-list">
                        {orders.map((order) => {
                          const statusBadge = getStatusBadge(order.status);
                          const hasProductsToBuy = order.items?.some(item => item.needsPurchase);
                          const isExpanded = expandedOrders.has(order.id);

                          return (
                            <div key={order.id} className={`order-card ${hasProductsToBuy ? 'needs-purchase' : ''}`}>
                              <div className="order-header">
                                <div className="order-info">
                                  <div className="order-title-row">
                                    <h3>
                                      Commande #{order.id.slice(0, 8).toUpperCase()}
                                    </h3>
                                    <button
                                      className="btn-expand"
                                      onClick={() => toggleOrderExpansion(order.id)}
                                      title={isExpanded ? 'Réduire' : 'Développer'}
                                    >
                                      {isExpanded ? '▼' : '▶'}
                                    </button>
                                  </div>
                                  <div className="order-meta">
                                    <span className="order-date">
                                      📅 {formatShortDate(order.createdAt)}
                                    </span>
                                    <span className={`status-badge ${statusBadge.class}`}>
                                      {statusBadge.icon} {statusBadge.label}
                                    </span>
                                    {hasProductsToBuy && (
                                      <span className="purchase-badge">
                                        ⚠️ Achat nécessaire
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="order-totals">
                                  <div className="total-item">
                                    <span className="total-label">Total HT:</span>
                                    <span className="total-value">{formatPrice(order.totalHT)}</span>
                                  </div>
                                  <div className="total-item">
                                    <span className="total-label">Total TTC:</span>
                                    <span className="total-value highlight">
                                      {formatPrice(order.totalTTC)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="order-expanded-content">
                                  <div className="order-items">
                                    <h4>Produits commandés ({order.items?.length || 0})</h4>
                                    <table className="items-table">
                                      <thead>
                                        <tr>
                                          <th>Produit</th>
                                          <th>Quantité</th>
                                          <th>Stock disponible</th>
                                          <th>Prix HT</th>
                                          <th>Total HT</th>
                                          <th>Statut</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {order.items?.map((item) => (
                                          <tr
                                            key={item.id}
                                            className={item.needsPurchase ? 'needs-purchase-row' : ''}
                                          >
                                            <td>
                                              <strong>{item.product?.name || 'Produit'}</strong>
                                              <span className="unit">({item.product?.unit || 'unité'})</span>
                                            </td>
                                            <td>{item.quantity} {item.product?.unit || ''}</td>
                                            <td>
                                              {item.product?.stock !== undefined ? (
                                                <span className={item.product.stock < item.quantity ? 'stock-insufficient' : 'stock-ok'}>
                                                  {item.product.stock} {item.product?.unit || ''}
                                                </span>
                                              ) : (
                                                <span className="stock-unknown">N/A</span>
                                              )}
                                            </td>
                                            <td>{formatPrice(item.priceHT)}</td>
                                            <td>{formatPrice(item.totalHT)}</td>
                                            <td>
                                              {item.needsPurchase ? (
                                                <span className="purchase-indicator">
                                                  ⚠️ À acheter
                                                </span>
                                              ) : (
                                                <span className="ready-indicator">
                                                  ✅ Disponible
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  <div className="order-actions">
                                    <select
                                      value={order.status}
                                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                      className="status-select"
                                    >
                                      <option value="NEW">Nouvelle</option>
                                      <option value="PREPARATION">En préparation</option>
                                      <option value="LIVRAISON">En livraison</option>
                                      <option value="LIVREE">Livrée</option>
                                    </select>
                                    <button
                                      className="btn btn-primary"
                                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                                    >
                                      Voir les détails complets
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vue compacte */}
              {viewMode === 'compact' && (
                <div className="orders-list-compact">
                  {filteredOrders.map((order) => {
                    const statusBadge = getStatusBadge(order.status);
                    const hasProductsToBuy = order.items?.some(item => item.needsPurchase);

                    return (
                      <div key={order.id} className={`order-card-compact ${hasProductsToBuy ? 'needs-purchase' : ''}`}>
                        <div className="compact-order-info">
                          <span className="compact-order-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                          <span className="compact-shop-name">{order.shop?.name || 'Magasin'}</span>
                          <span className={`status-badge ${statusBadge.class}`}>
                            {statusBadge.icon} {statusBadge.label}
                          </span>
                          {hasProductsToBuy && <span className="purchase-badge">⚠️</span>}
                        </div>
                        <div className="compact-order-totals">
                          <span className="compact-total">{formatPrice(order.totalTTC)}</span>
                          <span className="compact-items">{order.items?.length || 0} produit(s)</span>
                        </div>
                        <button
                          className="btn btn-sm"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                        >
                          Détails
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Preparation;
