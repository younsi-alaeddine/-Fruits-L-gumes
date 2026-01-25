import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './StockProducts.css';

const StockProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    stockFilter: '', // 'low', 'out', 'normal'
    category: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const updateStock = async (productId, quantity, reason) => {
    try {
      await api.patch(`/products/${productId}/stock`, {
        quantity: parseFloat(quantity),
        reason: reason || 'MANUAL_ADJUSTMENT'
      });
      toast.success('Stock mis à jour');
      fetchProducts();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du stock');
    }
  };

  const getStockStatus = (product) => {
    if (product.stock <= 0) return 'out';
    if (product.stock <= product.stockAlert) return 'low';
    return 'normal';
  };

  const filteredProducts = products.filter(product => {
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.stockFilter) {
      const status = getStockStatus(product);
      if (filters.stockFilter !== status) return false;
    }
    if (filters.category && product.category !== filters.category) {
      return false;
    }
    return true;
  });

  return (
    <div className="stock-products">
      <h1>📦 Gestion du Stock</h1>

      <div className="filters-card">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters-grid">
          <div className="form-group">
            <label>Filtre Stock</label>
            <select
              value={filters.stockFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, stockFilter: e.target.value }))}
            >
              <option value="">Tous</option>
              <option value="low">Stock faible</option>
              <option value="out">Rupture de stock</option>
              <option value="normal">Stock normal</option>
            </select>
          </div>
        </div>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Stock actuel</th>
              <th>Alerte</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="loading-cell">Chargement...</td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">Aucun produit trouvé</td>
              </tr>
            ) : (
              filteredProducts.map(product => {
                const status = getStockStatus(product);
                return (
                  <tr key={product.id} className={`stock-row status-${status}`}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td className="stock-value">{product.stock} {product.unit}</td>
                    <td>{product.stockAlert} {product.unit}</td>
                    <td>
                      <span className={`status-badge status-${status}`}>
                        {status === 'out' ? 'Rupture' : status === 'low' ? 'Faible' : 'Normal'}
                      </span>
                    </td>
                    <td>
                      <div className="stock-actions">
                        <input
                          type="number"
                          placeholder="Qté"
                          className="stock-input"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateStock(product.id, e.target.value, 'MANUAL_ADJUSTMENT');
                              e.target.value = '';
                            }
                          }}
                        />
                        <button
                          className="btn-small"
                          onClick={(e) => {
                            const input = e.target.previousElementSibling;
                            updateStock(product.id, input.value, 'MANUAL_ADJUSTMENT');
                            input.value = '';
                          }}
                        >
                          Mettre à jour
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockProducts;
