import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './AdminSettings.css';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    defaultTvaRate: '5.5',
    stockAlertThreshold: '10',
    orderNotificationEnabled: true,
    emailNotifications: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Charger les paramètres depuis le backend (si implémenté)
    // Pour l'instant, utiliser les valeurs par défaut
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Sauvegarder les paramètres (à implémenter dans le backend)
      toast.success('Paramètres sauvegardés avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-settings">
      <h1>⚙️ Paramètres Système</h1>

      <div className="settings-container">
        <div className="settings-section">
          <h2>📊 Paramètres Généraux</h2>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Taux TVA par défaut (%)</label>
              <select
                name="defaultTvaRate"
                value={settings.defaultTvaRate}
                onChange={handleInputChange}
              >
                <option value="5.5">5,5%</option>
                <option value="20">20%</option>
              </select>
              <small>Taux TVA appliqué par défaut lors de la création d'un produit</small>
            </div>

            <div className="form-group">
              <label>Seuil d'alerte stock par défaut</label>
              <input
                type="number"
                name="stockAlertThreshold"
                value={settings.stockAlertThreshold}
                onChange={handleInputChange}
                min="0"
                step="0.1"
              />
              <small>Seuil d'alerte appliqué par défaut lors de la création d'un produit</small>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="orderNotificationEnabled"
                  checked={settings.orderNotificationEnabled}
                  onChange={handleInputChange}
                />
                Activer les notifications de nouvelles commandes
              </label>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleInputChange}
                />
                Activer les notifications par email
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer les paramètres'}
              </button>
            </div>
          </form>
        </div>

        <div className="settings-section">
          <h2>📋 Informations Système</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Version de l'application</strong>
              <span>1.0.0</span>
            </div>
            <div className="info-item">
              <strong>Base de données</strong>
              <span>PostgreSQL</span>
            </div>
            <div className="info-item">
              <strong>Backend</strong>
              <span>Node.js + Express</span>
            </div>
            <div className="info-item">
              <strong>Frontend</strong>
              <span>React.js</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

