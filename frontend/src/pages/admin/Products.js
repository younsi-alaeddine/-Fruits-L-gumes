import React, { useState, useEffect } from 'react';
import api, { getServerBaseURL } from '../../services/api';
import { toast } from 'react-toastify';
import './AdminProducts.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TOUS');
  const [selectedSubCategory, setSelectedSubCategory] = useState('TOUS');
  const [categoriesConfig, setCategoriesConfig] = useState(null);
  const [customCategories, setCustomCategories] = useState([]);
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formData, setFormData] = useState({
    name: '',
    priceHT: '',
    tvaRate: '5.5',
    unit: 'kg',
    category: 'FRUITS',
    categoryId: '',
    subCategory: '',
    subCategoryId: '',
    isActive: true,
    isVisibleToClients: true,
    stock: '0',
    stockAlert: '10',
    photo: null
  });

  useEffect(() => {
    fetchProducts(currentPage);
    fetchCategoriesConfig();
    fetchCustomCategories();
  }, [currentPage]);

  const fetchCustomCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setCustomCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Erreur chargement catégories personnalisées:', error);
    }
  };

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

  // Réinitialiser la page quand on change le filtre ou le tri
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
    // Réinitialiser la sous-catégorie quand la catégorie change
    if (selectedCategory === 'TOUS') {
      setSelectedSubCategory('TOUS');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, selectedSubCategory, sortField, sortOrder]);

  const fetchProducts = async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', itemsPerPage);
      
      // Envoyer les filtres au backend (admin uniquement)
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedCategory !== 'TOUS') {
        params.append('category', selectedCategory);
      }
      if (selectedSubCategory !== 'TOUS') {
        params.append('subCategory', selectedSubCategory);
      }
      
      // Envoyer les paramètres de tri au backend
      params.append('sortField', sortField);
      params.append('sortOrder', sortOrder);
      
      const response = await api.get(`/products?${params.toString()}`);
      
      if (response.data.success && response.data.products) {
        setProducts(response.data.products);
        
        // Utiliser la pagination du serveur
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des produits');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      photo: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('priceHT', formData.priceHT);
    submitData.append('tvaRate', formData.tvaRate);
    submitData.append('unit', formData.unit);
        submitData.append('category', formData.category);
        submitData.append('subCategory', formData.subCategory);
        submitData.append('isActive', formData.isActive);
        submitData.append('isVisibleToClients', formData.isVisibleToClients);
        submitData.append('stock', formData.stock);
        submitData.append('stockAlert', formData.stockAlert);
        if (formData.photo) {
          submitData.append('photo', formData.photo);
        }

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Produit modifié avec succès');
      } else {
        await api.post('/products', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Produit créé avec succès');
      }
      
      resetForm();
      fetchProducts(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    const hasCustomCategory = product.customCategory || product.categoryId;
    setUseCustomCategory(hasCustomCategory ? true : false);
    setFormData({
      name: product.name,
      priceHT: product.priceHT,
      tvaRate: product.tvaRate,
      unit: product.unit,
      category: product.category || 'FRUITS',
      categoryId: product.categoryId || '',
      subCategory: product.subCategory || '',
      subCategoryId: product.subCategoryId || '',
      isActive: product.isActive,
      isVisibleToClients: product.isVisibleToClients !== undefined ? product.isVisibleToClients : true,
      stock: product.stock || '0',
      stockAlert: product.stockAlert || '10',
      photo: null
    });
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver ce produit ?')) {
      return;
    }

    try {
      await api.delete(`/products/${productId}`);
      toast.success('Produit désactivé');
      fetchProducts(currentPage);
    } catch (error) {
      toast.error('Erreur lors de la désactivation');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      priceHT: '',
      tvaRate: '5.5',
      unit: 'kg',
      category: 'FRUITS',
      subCategory: '',
      isActive: true,
      isVisibleToClients: true,
      stock: '0',
      stockAlert: '10',
      photo: null
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Les produits sont maintenant filtrés et triés côté serveur
  // Plus besoin de filtrage/tri côté client

  // Obtenir les catégories uniques
  const categories = ['TOUS', ...new Set(products.map(p => p.category).filter(Boolean))];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Réinitialiser la page quand on change le filtre ou le tri
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory, sortField, sortOrder]);

  if (loading) {
    return <div className="loading">Chargement des produits...</div>;
  }

  return (
    <div className="admin-products">
      <div className="products-header">
        <h1>Gestion des Produits</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Annuler' : '+ Nouveau produit'}
        </button>
      </div>

      {showForm && (
        <div className="product-form-card">
          <h2>{editingProduct ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nom du produit *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Prix HT (€) *</label>
                <input
                  type="number"
                  name="priceHT"
                  value={formData.priceHT}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Taux TVA (%) *</label>
                <select
                  name="tvaRate"
                  value={formData.tvaRate}
                  onChange={handleInputChange}
                  required
                >
                  <option value="5.5">5,5%</option>
                  <option value="20">20%</option>
                </select>
              </div>

              <div className="form-group">
                <label>Unité *</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                >
                  <option value="kg">kg</option>
                  <option value="caisse">caisse</option>
                  <option value="piece">pièce</option>
                  <option value="botte">botte</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type de catégorie</label>
                <select
                  value={useCustomCategory ? 'custom' : 'default'}
                  onChange={(e) => {
                    const useCustom = e.target.value === 'custom';
                    setUseCustomCategory(useCustom);
                    setFormData(prev => ({
                      ...prev,
                      category: useCustom ? '' : 'FRUITS',
                      categoryId: useCustom ? '' : '',
                      subCategory: '',
                      subCategoryId: '',
                    }));
                  }}
                >
                  <option value="default">Catégories par défaut</option>
                  <option value="custom">Catégories personnalisées</option>
                </select>
              </div>

              <div className="form-group">
                <label>Catégorie *</label>
                {useCustomCategory ? (
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        categoryId: e.target.value,
                        subCategoryId: '',
                      }));
                    }}
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {customCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon || '📁'} {cat.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    name="category"
                    value={formData.category}
                    onChange={(e) => {
                      handleInputChange(e);
                      setFormData(prev => ({ ...prev, category: e.target.value, subCategory: '' }));
                    }}
                    required
                  >
                    <option value="FRUITS">🍎 Fruits</option>
                    <option value="LEGUMES">🥬 Légumes</option>
                    <option value="HERBES">🌿 Herbes aromatiques</option>
                    <option value="FRUITS_SECS">🥜 Fruits secs</option>
                  </select>
                )}
              </div>

              <div className="form-group">
                <label>Sous-catégorie</label>
                {useCustomCategory && formData.categoryId ? (
                  <select
                    name="subCategoryId"
                    value={formData.subCategoryId || ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, subCategoryId: e.target.value }));
                    }}
                  >
                    <option value="">Aucune sous-catégorie</option>
                    {customCategories
                      .find(cat => cat.id === formData.categoryId)
                      ?.subCategories
                      ?.map(subCat => (
                        <option key={subCat.id} value={subCat.id}>
                          {subCat.icon || '📌'} {subCat.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleInputChange}
                  >
                    <option value="">Auto (détectée)</option>
                    {categoriesConfig && categoriesConfig[formData.category]?.subCategories && 
                      Object.entries(categoriesConfig[formData.category].subCategories).map(([key, subCat]) => (
                        <option key={key} value={key}>
                          {subCat.icon} {subCat.name}
                        </option>
                      ))
                    }
                  </select>
                )}
                {!useCustomCategory && (
                  <small>Laissé vide, la sous-catégorie sera détectée automatiquement</small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Stock initial *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Seuil d'alerte *</label>
                <input
                  type="number"
                  name="stockAlert"
                  value={formData.stockAlert}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  required
                />
                <small>Une alerte sera affichée quand le stock sera inférieur ou égal à ce seuil</small>
              </div>
            </div>

            <div className="form-group">
              <label>Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {editingProduct?.photoUrl && !formData.photo && (
                <div className="current-photo">
                  <img
                    src={`${getServerBaseURL()}${editingProduct.photoUrl}`}
                    alt="Photo actuelle"
                    style={{ maxWidth: '200px', marginTop: '0.5rem' }}
                  />
                </div>
              )}
            </div>

            <div className="form-group form-checkboxes">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                Produit actif
              </label>
              <small>Le produit est actif dans le système</small>
            </div>

            <div className="form-group form-toggle-group">
              <label className="toggle-label">Visible pour les clients</label>
              <small>Le produit apparaîtra dans le catalogue client pour les commandes</small>
              <button
                type="button"
                className={`toggle-button ${formData.isVisibleToClients ? 'active' : 'inactive'}`}
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    isVisibleToClients: !prev.isVisibleToClients
                  }));
                }}
                title={formData.isVisibleToClients ? 'Cliquer pour masquer aux clients' : 'Cliquer pour afficher aux clients'}
              >
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {formData.isVisibleToClients ? '👁️ Visible' : '🚫 Masqué'}
                </span>
              </button>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingProduct ? 'Modifier' : 'Créer'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="products-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="category-filter">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubCategory('TOUS');
            }}
            className="category-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'TOUS' ? 'Toutes les catégories' : 
                 cat === 'FRUITS' ? '🍎 Fruits' :
                 cat === 'LEGUMES' ? '🥬 Légumes' :
                 cat === 'HERBES' ? '🌿 Herbes' :
                 cat === 'FRUITS_SECS' ? '🥜 Fruits secs' : cat}
              </option>
            ))}
          </select>
        </div>
        {selectedCategory !== 'TOUS' && categoriesConfig && categoriesConfig[selectedCategory] && (
          <div className="subcategory-filter">
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              className="subcategory-select"
            >
              <option value="TOUS">Toutes les sous-catégories</option>
              {Object.entries(categoriesConfig[selectedCategory].subCategories).map(([key, subCat]) => (
                <option key={key} value={key}>
                  {subCat.icon} {subCat.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="products-count">
          {products.length} produit{products.length > 1 ? 's' : ''} affiché{products.length > 1 ? 's' : ''} ({pagination.total} au total)
        </div>
      </div>

      <div className="products-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Photo</th>
              <th className="sortable" onClick={() => handleSort('name')}>
                Nom {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Catégorie</th>
              <th className="sortable" onClick={() => handleSort('priceHT')}>
                Prix HT {sortField === 'priceHT' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Prix TTC</th>
              <th className="sortable" onClick={() => handleSort('tvaRate')}>
                TVA {sortField === 'tvaRate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Unité</th>
              <th className="sortable" onClick={() => handleSort('stock')}>
                Stock {sortField === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Statut</th>
              <th>Visible clients</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center">
                  {searchTerm || selectedCategory !== 'TOUS' 
                    ? 'Aucun produit ne correspond à votre recherche' 
                    : 'Aucun produit'}
                </td>
              </tr>
            ) : (
              products.map(product => {
                const priceTTC = product.priceHT * (1 + product.tvaRate / 100);
                return (
                  <tr key={product.id} className={!product.isActive ? 'inactive' : ''}>
                    <td>
                      {product.photoUrl ? (
                        <img
                          src={`${getServerBaseURL()}${product.photoUrl}`}
                          alt={product.name}
                          className="product-thumbnail"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div style="width: 50px; height: 50px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 4px; color: #999; font-size: 10px;">Pas d\'image</div>';
                          }}
                        />
                      ) : (
                        <div className="no-photo">—</div>
                      )}
                    </td>
                    <td>{product.name}</td>
                    <td>
                      <div className="category-info">
                        <span className="category-badge">
                          {categoriesConfig && categoriesConfig[product.category] 
                            ? `${categoriesConfig[product.category].icon} ${categoriesConfig[product.category].name}`
                            : product.category === 'FRUITS' ? '🍎 Fruits' :
                              product.category === 'LEGUMES' ? '🥬 Légumes' :
                              product.category === 'HERBES' ? '🌿 Herbes' :
                              product.category === 'FRUITS_SECS' ? '🥜 Fruits secs' : '🍎 Fruits'}
                        </span>
                        {product.subCategory && categoriesConfig && categoriesConfig[product.category]?.subCategories?.[product.subCategory] && (
                          <span className="subcategory-badge" title={categoriesConfig[product.category].subCategories[product.subCategory].name}>
                            {categoriesConfig[product.category].subCategories[product.subCategory].icon}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{formatPrice(product.priceHT)}</td>
                    <td className="price-cell">{formatPrice(priceTTC)}</td>
                    <td>{product.tvaRate}%</td>
                    <td>{product.unit}</td>
                    <td>
                      <div className="stock-cell">
                        <span className={`stock-badge ${(product.stock || 0) <= (product.stockAlert || 10) ? 'low' : 'ok'}`}>
                          {product.stock || 0} {product.unit}
                        </span>
                        {(product.stock || 0) <= (product.stockAlert || 10) && (
                          <span className="stock-alert-icon" title="Stock faible">⚠️</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                        {product.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`toggle-button-small ${product.isVisibleToClients !== false ? 'active' : 'inactive'}`}
                        onClick={async () => {
                          try {
                            const submitData = new FormData();
                            submitData.append('isVisibleToClients', (!product.isVisibleToClients).toString());
                            
                            await api.put(`/products/${product.id}/toggle-visibility`);
                            
                            toast.success(`Produit ${!product.isVisibleToClients ? 'affiché' : 'masqué'} aux clients`);
                            fetchProducts(currentPage);
                          } catch (error) {
                            toast.error('Erreur lors de la modification');
                          }
                        }}
                        title={product.isVisibleToClients !== false ? 'Cliquer pour masquer aux clients' : 'Cliquer pour afficher aux clients'}
                      >
                        <span className="toggle-icon">
                          {product.isVisibleToClients !== false ? '👁️' : '🚫'}
                        </span>
                        <span className="toggle-label-small">
                          {product.isVisibleToClients !== false ? 'Visible' : 'Masqué'}
                        </span>
                      </button>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(product)}
                          className="btn btn-secondary btn-sm"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Désactiver
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="pagination-btn"
            >
              Précédent
            </button>
            <div className="pagination-info">
              Page {currentPage} sur {pagination.totalPages} ({pagination.total} produits)
            </div>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="pagination-btn"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;

