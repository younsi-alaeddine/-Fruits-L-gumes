import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './AdminStock.css';

const AdminStock = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('TOUS');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockForm, setStockForm] = useState({
    stock: '',
    stockAlert: ''
  });

  useEffect(() => {
    fetchStock();
  }, [filterLowStock, selectedCategory]);

  const fetchStock = async () => {
    try {
      const params = new URLSearchParams();
      if (filterLowStock) params.append('lowStock', 'true');
      if (selectedCategory !== 'TOUS') params.append('category', selectedCategory);

      const response = await api.get(`/stock?${params.toString()}`);
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Erreur lors du chargement du stock');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setStockForm({
      stock: product.stock,
      stockAlert: product.stockAlert
    });
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/stock/${editingProduct.id}`, stockForm);
      toast.success('Stock mis à jour avec succès');
      setEditingProduct(null);
      fetchStock();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleAdjustStock = async (productId, quantity) => {
    try {
      await api.post(`/stock/${productId}/adjust`, { quantity });
      toast.success(`Stock ajusté de ${quantity > 0 ? '+' : ''}${quantity}`);
      fetchStock();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajustement');
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/stock/alerts');
      return response.data.count;
    } catch (error) {
      return 0;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getCategoryLabel = (category) => {
    const labels = {
      'FRUITS': '🍎 Fruits',
      'LEGUMES': '🥬 Légumes',
      'HERBES': '🌿 Herbes aromatiques',
      'FRUITS_SECS': '🥜 Fruits secs'
    };
    return labels[category] || category;
  };

  if (loading) {
    return <div className="loading">Chargement du stock...</div>;
  }

  const lowStockCount = products.filter(p => p.isLowStock).length;

  return (
    <div className="admin-stock">
      <div className="stock-header">
        <h1>📦 Gestion du Stock</h1>
        {lowStockCount > 0 && (
          <div className="alert-badge">
            ⚠️ {lowStockCount} produit{lowStockCount > 1 ? 's' : ''} en stock faible
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="stock-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
            />
            Stock faible uniquement
          </label>
        </div>
        <div className="filter-group">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="TOUS">Toutes les catégories</option>
            <option value="FRUITS">🍎 Fruits</option>
            <option value="LEGUMES">🥬 Légumes</option>
            <option value="HERBES">🌿 Herbes aromatiques</option>
            <option value="FRUITS_SECS">🥜 Fruits secs</option>
          </select>
        </div>
      </div>

      {/* Tableau du stock */}
      <div className="stock-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Stock</th>
              <th>Seuil d'alerte</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">Aucun produit trouvé</td>
              </tr>
            ) : (
              filteredProducts.map(product => (
                <tr 
                  key={product.id} 
                  className={product.isLowStock ? 'low-stock-row' : ''}
                >
                  <td><strong>{product.name}</strong></td>
                  <td>{getCategoryLabel(product.category)}</td>
                  <td>
                    <span className={`stock-value ${product.isLowStock ? 'low' : ''}`}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td>{product.stockAlert} {product.unit}</td>
                  <td>
                    {product.isLowStock ? (
                      <span className="alert-badge-small">⚠️ Stock faible</span>
                    ) : (
                      <span className="status-ok">✅ OK</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(product)}
                        className="btn btn-info btn-sm"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleAdjustStock(product.id, 10)}
                        className="btn btn-success btn-sm"
                        title="Ajouter 10"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => handleAdjustStock(product.id, -10)}
                        className="btn btn-warning btn-sm"
                        title="Retirer 10"
                      >
                        -10
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de modification */}
      {editingProduct && (
        <div className="stock-modal" onClick={() => setEditingProduct(null)}>
          <div className="stock-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier le stock</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="btn-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateStock}>
              <div className="form-group">
                <label>Produit</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  disabled
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Stock actuel ({editingProduct.unit})</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={stockForm.stock}
                  onChange={(e) => setStockForm({ ...stockForm, stock: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Seuil d'alerte ({editingProduct.unit})</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={stockForm.stockAlert}
                  onChange={(e) => setStockForm({ ...stockForm, stockAlert: e.target.value })}
                  className="form-input"
                  required
                />
                <small>Une alerte sera affichée quand le stock sera inférieur ou égal à ce seuil</small>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStock;

