import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './StockDashboard.css';

const StockDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  const fetchProducts = async () => {
    try {
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

  const fetchStats = async () => {
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.stockAlert).length;
    const outOfStockCount = products.filter(p => p.stock <= 0).length;
    
    setStats({
      totalProducts: products.length,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount
    });
  };

  useEffect(() => {
    if (products.length > 0) {
      fetchStats();
    }
  }, [products]);

  const updateStock = async (productId, newStock) => {
    try {
      const response = await api.patch(`/products/${productId}`, { stock: newStock });
      if (response.data.success) {
        toast.success('Stock mis à jour avec succès');
        fetchProducts();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du stock');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.stockAlert);
  const outOfStockProducts = products.filter(p => p.stock <= 0);

  return (
    <div className="stock-dashboard">
      <h1>📦 Tableau de Bord - Gestionnaire de Stock</h1>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalProducts}</div>
            <div className="stat-label">Total produits</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.lowStock}</div>
            <div className="stat-label">Stock faible</div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <div className="stat-value">{stats.outOfStock}</div>
            <div className="stat-label">Rupture de stock</div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="alerts-section">
          <h2>Alertes de stock</h2>
          {outOfStockProducts.length > 0 && (
            <div className="alert-list">
              <h3>Ruptures de stock</h3>
              {outOfStockProducts.map((product) => (
                <div key={product.id} className="alert-item danger">
                  <span>{product.name}</span>
                  <span>Stock: {product.stock} {product.unit}</span>
                </div>
              ))}
            </div>
          )}
          {lowStockProducts.length > 0 && (
            <div className="alert-list">
              <h3>Stocks faibles</h3>
              {lowStockProducts.map((product) => (
                <div key={product.id} className="alert-item warning">
                  <span>{product.name}</span>
                  <span>Stock: {product.stock} / Alerte: {product.stockAlert} {product.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Liste des produits */}
      <div className="products-section">
        <h2>Tous les produits</h2>
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Stock actuel</th>
                <th>Alerte</th>
                <th>Unité</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className={product.stock <= 0 ? 'out-of-stock' : product.stock <= product.stockAlert ? 'low-stock' : ''}>
                  <td>{product.name}</td>
                  <td>{product.stock}</td>
                  <td>{product.stockAlert}</td>
                  <td>{product.unit}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      defaultValue={product.stock}
                      onBlur={(e) => {
                        const newStock = parseFloat(e.target.value);
                        if (!isNaN(newStock) && newStock !== product.stock) {
                          updateStock(product.id, newStock);
                        }
                      }}
                      className="stock-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;
