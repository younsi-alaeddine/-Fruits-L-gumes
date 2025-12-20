import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './AdminPromotions.css';

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: '',
    minAmount: '',
    maxDiscount: '',
    validFrom: '',
    validTo: '',
    usageLimit: '',
    isActive: true,
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await api.get('/promotions');
      setPromotions(response.data.promotions || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/promotions', formData);
      toast.success('Promotion créée avec succès');
      setShowForm(false);
      resetForm();
      fetchPromotions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: '',
      minAmount: '',
      maxDiscount: '',
      validFrom: '',
      validTo: '',
      usageLimit: '',
      isActive: true,
    });
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.put(`/promotions/${id}`, { isActive: !isActive });
      toast.success('Promotion modifiée');
      fetchPromotions();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette promotion ?')) return;
    try {
      await api.delete(`/promotions/${id}`);
      toast.success('Promotion supprimée');
      fetchPromotions();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="admin-promotions">
      <div className="header">
        <h1>🏷️ Promotions</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Nouvelle promotion'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h2>Créer une promotion</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Code promo *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="PERCENTAGE">Pourcentage</option>
                  <option value="FIXED_AMOUNT">Montant fixe</option>
                  <option value="FREE_SHIPPING">Livraison gratuite</option>
                </select>
              </div>
              <div className="form-group">
                <label>Valeur *</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                  step="0.01"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Montant minimum (€)</label>
                <input
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Remise maximale (€)</label>
                <input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  step="0.01"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date de début *</label>
                <input
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date de fin *</label>
                <input
                  type="datetime-local"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Limite d'utilisation</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                min="1"
              />
            </div>
            <button type="submit" className="btn btn-primary">Créer</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : promotions.length === 0 ? (
        <div className="empty-state">Aucune promotion</div>
      ) : (
        <div className="promotions-table-container">
          <table className="promotions-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Type</th>
                <th>Valeur</th>
                <th>Validité</th>
                <th>Utilisations</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.id}>
                  <td><strong>{promo.code}</strong></td>
                  <td>{promo.name}</td>
                  <td>{promo.type === 'PERCENTAGE' ? '%' : '€'}</td>
                  <td>{promo.value}</td>
                  <td>
                    {format(new Date(promo.validFrom), 'PP', { locale: fr })} - {format(new Date(promo.validTo), 'PP', { locale: fr })}
                  </td>
                  <td>{promo.usageCount} / {promo.usageLimit || '∞'}</td>
                  <td>
                    <span className={`badge ${promo.isActive ? 'active' : 'inactive'}`}>
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="promo-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleToggleActive(promo.id, promo.isActive)}
                      >
                        {promo.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(promo.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPromotions;
