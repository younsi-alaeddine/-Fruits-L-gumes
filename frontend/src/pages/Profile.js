import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const { user, fetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    shopName: '',
    address: '',
    city: '',
    postalCode: '',
    shopPhone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        shopName: user.shop?.name || '',
        address: user.shop?.address || '',
        city: user.shop?.city || '',
        postalCode: user.shop?.postalCode || '',
        shopPhone: user.shop?.phone || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user.role === 'CLIENT' && user.shop) {
        // Mettre à jour le magasin et l'utilisateur
        await api.put(`/shops/${user.shop.id}`, {
          name: formData.shopName,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          phone: formData.shopPhone,
          userName: formData.name,
          email: formData.email,
          userPhone: formData.phone
        });
      } else {
        // Mettre à jour uniquement l'utilisateur (pour admin)
        await api.put('/auth/profile', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        });
      }
      
      toast.success('Profil mis à jour avec succès');
      await fetchUser(); // Rafraîchir les données utilisateur
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Mot de passe modifié avec succès');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="profile-page">
      <h1>Mon Profil</h1>

      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          📝 Informations
        </button>
        <button
          className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          🔒 Mot de passe
        </button>
      </div>

      {/* Onglet Informations */}
      {activeTab === 'info' && (
        <div className="profile-form-card">
          <h2>Mes Informations</h2>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-section">
              <h3>Informations personnelles</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
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

            {user.role === 'CLIENT' && user.shop && (
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
                    <label>Téléphone magasin</label>
                    <input
                      type="tel"
                      name="shopPhone"
                      value={formData.shopPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Onglet Mot de passe */}
      {activeTab === 'password' && (
        <div className="profile-form-card">
          <h2>Changer le mot de passe</h2>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Mot de passe actuel *</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Nouveau mot de passe *</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                minLength="6"
                required
              />
              <small>Minimum 6 caractères</small>
            </div>
            <div className="form-group">
              <label>Confirmer le nouveau mot de passe *</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                minLength="6"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
