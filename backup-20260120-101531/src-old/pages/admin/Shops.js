import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './AdminShops.css';

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionBusyIds, setActionBusyIds] = useState(() => new Set());
  const [selectedShop, setSelectedShop] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [formData, setFormData] = useState({
    shopName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    userName: '',
    email: '',
    password: '',
    userPhone: ''
  });

  useEffect(() => {
    fetchShops(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchShops(1);
  }, [searchTerm]);

  const fetchShops = async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', itemsPerPage);
      
      const response = await api.get(`/shops?${params.toString()}`);
      
      if (response.data.success && response.data.shops) {
        // Filtrer côté client pour la recherche
        let filteredShops = response.data.shops;
        
        if (searchTerm) {
          filteredShops = filteredShops.filter(shop =>
            shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shop.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (shop.user && shop.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        setShops(filteredShops);
        
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else if (response.data.shops) {
        setShops(response.data.shops);
      } else {
        setShops([]);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des magasins');
    } finally {
      setLoading(false);
    }
  };

  const fetchShopDetails = async (shopId) => {
    try {
      const response = await api.get(`/shops/${shopId}`);
      setSelectedShop(response.data.shop);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // Phase 2: prevent double submit
    
    try {
      setSubmitting(true); // Phase 2: disable UI to prevent double-submit
      if (editingShop) {
        // Modification
        await api.put(`/shops/${editingShop.id}`, {
          name: formData.shopName,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          phone: formData.phone,
          userName: formData.userName,
          email: formData.email,
          userPhone: formData.userPhone
        });
        toast.success('Magasin modifié avec succès');
      } else {
        // Création
        await api.post('/shops', formData);
        toast.success('Magasin créé avec succès');
      }
      
      resetForm();
      fetchShops(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (shop) => {
    setEditingShop(shop);
    setFormData({
      shopName: shop.name,
      address: shop.address,
      city: shop.city,
      postalCode: shop.postalCode,
      phone: shop.phone || '',
      userName: shop.user.name,
      email: shop.user.email,
      password: '',
      userPhone: shop.user.phone || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (shopId) => {
    if (actionBusyIds.has(shopId)) return; // Phase 2: prevent double click
    const shop = shops.find(s => s.id === shopId);
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le magasin "${shop.name}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      setActionBusyIds(prev => new Set(prev).add(shopId));
      await api.delete(`/shops/${shopId}`);
      toast.success('Magasin supprimé avec succès');
      fetchShops(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setActionBusyIds(prev => {
        const next = new Set(prev);
        next.delete(shopId);
        return next;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      shopName: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      userName: '',
      email: '',
      password: '',
      userPhone: ''
    });
    setEditingShop(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filtrer les magasins
  const filteredShops = shops.filter(shop => {
    const searchLower = searchTerm.toLowerCase();
    return (
      shop.name.toLowerCase().includes(searchLower) ||
      shop.city.toLowerCase().includes(searchLower) ||
      shop.postalCode.includes(searchLower) ||
      shop.user.name.toLowerCase().includes(searchLower) ||
      shop.user.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <div className="loading">Chargement des magasins...</div>;
  }

  return (
    <div className="admin-shops">
      <div className="shops-header">
        <h1>Gestion des Magasins</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Annuler' : '+ Nouveau magasin'}
        </button>
      </div>

      {/* Formulaire de création/modification */}
      {showForm && (
        <div className="shop-form-card">
          <h2>{editingShop ? 'Modifier le magasin' : 'Nouveau magasin'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Informations du magasin</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom du magasin *</label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ville *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Adresse *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Code postal *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    pattern="[0-9]{5}"
                    maxLength="5"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Téléphone magasin</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Informations du contact</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom du contact *</label>
                  <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone contact</label>
                  <input
                    type="tel"
                    name="userPhone"
                    value={formData.userPhone}
                    onChange={handleInputChange}
                  />
                </div>
                {!editingShop && (
                  <div className="form-group">
                    <label>Mot de passe *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      minLength="6"
                      required={!editingShop}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {submitting ? 'Enregistrement...' : (editingShop ? 'Modifier' : 'Créer')}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recherche */}
      <div className="shops-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher un magasin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="shops-count">
          {filteredShops.length} magasin{filteredShops.length > 1 ? 's' : ''} affiché{filteredShops.length > 1 ? 's' : ''}
          {!searchTerm && (
            <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
              (sur {pagination.total} au total)
            </span>
          )}
        </div>
      </div>

      {/* Tableau des magasins */}
      <div className="shops-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Ville</th>
              <th>Code postal</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Commandes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredShops.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  {searchTerm ? 'Aucun magasin ne correspond à votre recherche' : 'Aucun magasin'}
                </td>
              </tr>
            ) : (
              filteredShops.map(shop => (
                <tr key={shop.id}>
                  <td><strong>{shop.name}</strong></td>
                  <td>{shop.city}</td>
                  <td>{shop.postalCode}</td>
                  <td>
                    <div>{shop.user.name}</div>
                    {shop.phone && <div className="phone">{shop.phone}</div>}
                  </td>
                  <td>{shop.user.email}</td>
                  <td>{shop._count.orders}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => fetchShopDetails(shop.id)}
                        className="btn btn-secondary btn-sm"
                        disabled={actionBusyIds.has(shop.id)}
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => handleEdit(shop)}
                        className="btn btn-info btn-sm"
                        disabled={submitting}
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(shop.id)}
                        className="btn btn-danger btn-sm"
                        disabled={shop._count.orders > 0 || actionBusyIds.has(shop.id)}
                        title={shop._count.orders > 0 ? 'Impossible de supprimer un magasin avec des commandes' : ''}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de détails */}
      {selectedShop && (
        <div className="shop-details-modal" onClick={() => setSelectedShop(null)}>
          <div className="shop-details-content" onClick={(e) => e.stopPropagation()}>
            <div className="shop-details-header">
              <h2>Détails du magasin</h2>
              <button
                onClick={() => setSelectedShop(null)}
                className="btn-close"
              >
                ×
              </button>
            </div>
            <div className="shop-details-body">
              <div className="shop-info-section">
                <h3>Informations du magasin</h3>
                <p><strong>Nom :</strong> {selectedShop.name}</p>
                <p><strong>Adresse :</strong> {selectedShop.address}</p>
                <p><strong>Ville :</strong> {selectedShop.city}</p>
                <p><strong>Code postal :</strong> {selectedShop.postalCode}</p>
                {selectedShop.phone && (
                  <p><strong>Téléphone :</strong> {selectedShop.phone}</p>
                )}
              </div>

              <div className="shop-info-section">
                <h3>Contact</h3>
                <p><strong>Nom :</strong> {selectedShop.user.name}</p>
                <p><strong>Email :</strong> {selectedShop.user.email}</p>
                {selectedShop.user.phone && (
                  <p><strong>Téléphone :</strong> {selectedShop.user.phone}</p>
                )}
              </div>

              {selectedShop.orders && selectedShop.orders.length > 0 && (
                <div className="shop-info-section">
                  <h3>Dernières commandes</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Produits</th>
                        <th>Total TTC</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedShop.orders.map(order => (
                        <tr key={order.id}>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>{order.items.length} produit{order.items.length > 1 ? 's' : ''}</td>
                          <td className="price-cell">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR'
                            }).format(order.totalTTC)}
                          </td>
                          <td>
                            <span className={`status-badge status-${order.status.toLowerCase()}`}>
                              {order.status === 'NEW' && 'Nouvelle'}
                              {order.status === 'PREPARATION' && 'En préparation'}
                              {order.status === 'LIVRAISON' && 'En livraison'}
                              {order.status === 'LIVREE' && 'Livrée'}
                              {order.status === 'ANNULEE' && 'Annulée'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!searchTerm && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="pagination-btn"
          >
            Précédent
          </button>
          <div className="pagination-info">
            Page {currentPage} sur {pagination.totalPages} ({pagination.total} magasins)
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
                onClick={() => setCurrentPage(pageNum)}
                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="pagination-btn"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminShops;
