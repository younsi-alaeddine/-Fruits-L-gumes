import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import './ClientShops.css';

const ClientShops = () => {
  const { user, setActiveShopId, fetchUser } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    siret: '',
    tvaNumber: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: ''
  });

  useEffect(() => {
    fetchShops(currentPage);
  }, [currentPage]);

  const fetchShops = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 20);
      
      const response = await api.get(`/client/shops?${params.toString()}`);
      
      if (response.data.success) {
        setShops(response.data.shops || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setShops([]);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des magasins');
      console.error('Erreur chargement magasins:', error);
    } finally {
      setLoading(false);
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
    if (submitting) return;
    
    try {
      setSubmitting(true);
      if (editingShop) {
        await api.put(`/client/shops/${editingShop.id}`, formData);
        toast.success('Magasin modifié avec succès');
      } else {
        await api.post('/client/shops', formData);
        toast.success('Magasin créé avec succès');
      }
      
      resetForm();
      await fetchShops(currentPage);
      await fetchUser();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      address: shop.address,
      city: shop.city,
      postalCode: shop.postalCode,
      phone: shop.phone || '',
      siret: shop.siret || '',
      tvaNumber: shop.tvaNumber || '',
      contactPerson: shop.contactPerson || '',
      contactEmail: shop.contactEmail || '',
      contactPhone: shop.contactPhone || ''
    });
    setShowForm(true);
  };

  const handleSetActiveShop = async (shopId) => {
    try {
      await setActiveShopId(shopId);
      toast.success('Magasin actif changé avec succès');
    } catch (error) {
      toast.error('Erreur lors du changement de magasin actif');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      siret: '',
      tvaNumber: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: ''
    });
    setEditingShop(null);
    setShowForm(false);
  };

  const activeShopId = user?.shop?.id || localStorage.getItem('activeShopId');

  if (loading) {
    return <div className="loading">Chargement des magasins...</div>;
  }

  return (
    <div className="client-shops">
      <div className="shops-header">
        <h1>🏪 Gestion des Magasins</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          ➕ Nouveau magasin
        </button>
      </div>

      {showForm && (
        <div className="shop-form-card">
          <h2>{editingShop ? 'Modifier le magasin' : 'Nouveau magasin'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nom du magasin *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
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
            <div className="form-row">
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
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>SIRET</label>
                <input
                  type="text"
                  name="siret"
                  value={formData.siret}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Numéro TVA</label>
                <input
                  type="text"
                  name="tvaNumber"
                  value={formData.tvaNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Personne de contact</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Email de contact</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Téléphone de contact</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Enregistrement...' : editingShop ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="shops-grid">
        {shops.length === 0 ? (
          <div className="empty-state">
            <p>Aucun magasin trouvé. Créez votre premier magasin !</p>
          </div>
        ) : (
          shops.map(shop => (
            <div
              key={shop.id}
              className={`shop-card ${shop.id === activeShopId ? 'active' : ''}`}
            >
              <div className="shop-card-header">
                <h3>{shop.name}</h3>
                {shop.id === activeShopId && (
                  <span className="active-badge">Actif</span>
                )}
              </div>
              <div className="shop-card-body">
                <p><strong>📍</strong> {shop.address}</p>
                <p><strong>🏙️</strong> {shop.city} {shop.postalCode}</p>
                {shop.phone && <p><strong>📞</strong> {shop.phone}</p>}
                {shop.contactPerson && (
                  <p><strong>👤</strong> {shop.contactPerson}</p>
                )}
                {shop._count?.orders !== undefined && (
                  <p><strong>📋</strong> {shop._count.orders} commande(s)</p>
                )}
              </div>
              <div className="shop-card-actions">
                {shop.id !== activeShopId && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleSetActiveShop(shop.id)}
                  >
                    🔄 Utiliser ce magasin
                  </button>
                )}
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => handleEdit(shop)}
                >
                  ✏️ Modifier
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage}
          >
            ← Précédent
          </button>
          <span>
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={!pagination.hasNextPage}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientShops;
