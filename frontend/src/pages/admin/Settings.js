import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './AdminSettings.css';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      if (response.data.success) {
        // Convertir l'objet groupé en objet plat
        const flatSettings = {};
        Object.values(response.data.settings).forEach(categorySettings => {
          categorySettings.forEach(setting => {
            flatSettings[setting.key] = setting;
          });
        });
        setSettings(flatSettings);
      }
    } catch (error) {
      console.error('Erreur chargement settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: typeof prev[key]?.value === 'boolean' 
          ? (value === 'true' || value === true)
          : value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const settingsArray = Object.entries(settings).map(([key, setting]) => ({
        key,
        value: setting.value
      }));

      await api.put('/settings', { settings: settingsArray });
      toast.success('Paramètres sauvegardés avec succès');
      fetchSettings();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getValue = (key, defaultValue = '') => {
    return settings[key]?.value ?? defaultValue;
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="admin-settings">
      <h1>⚙️ Paramètres Système</h1>

      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          📊 Général
        </button>
        <button
          className={`tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          📧 Email
        </button>
        <button
          className={`tab ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          📦 Stock
        </button>
        <button
          className={`tab ${activeTab === 'tax' ? 'active' : ''}`}
          onClick={() => setActiveTab('tax')}
        >
          💰 Taxes
        </button>
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          🛒 Commandes
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="settings-section">
            <h2>Paramètres Généraux</h2>
            <div className="form-group">
              <label>Nom de l'entreprise</label>
              <input
                type="text"
                value={getValue('company_name')}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Adresse</label>
              <input
                type="text"
                value={getValue('company_address')}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Ville</label>
              <input
                type="text"
                value={getValue('company_city')}
                onChange={(e) => handleInputChange('company_city', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Code Postal</label>
              <input
                type="text"
                value={getValue('company_postal_code')}
                onChange={(e) => handleInputChange('company_postal_code', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="text"
                value={getValue('company_phone')}
                onChange={(e) => handleInputChange('company_phone', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={getValue('company_email')}
                onChange={(e) => handleInputChange('company_email', e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="settings-section">
            <h2>Configuration Email</h2>
            <div className="form-group">
              <label>Serveur SMTP</label>
              <input
                type="text"
                value={getValue('smtp_host')}
                onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="form-group">
              <label>Port SMTP</label>
              <input
                type="number"
                value={getValue('smtp_port')}
                onChange={(e) => handleInputChange('smtp_port', e.target.value)}
                placeholder="587"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={getValue('smtp_secure') === 'true' || getValue('smtp_secure') === true}
                  onChange={(e) => handleInputChange('smtp_secure', e.target.checked ? 'true' : 'false')}
                />
                SMTP sécurisé (SSL/TLS)
              </label>
            </div>
            <div className="form-group">
              <label>Email expéditeur</label>
              <input
                type="email"
                value={getValue('email_from')}
                onChange={(e) => handleInputChange('email_from', e.target.value)}
                placeholder="noreply@fruits-legumes.fr"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={getValue('email_notifications_enabled') === 'true' || getValue('email_notifications_enabled') === true}
                  onChange={(e) => handleInputChange('email_notifications_enabled', e.target.checked ? 'true' : 'false')}
                />
                Activer les notifications par email
              </label>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="settings-section">
            <h2>Configuration Stock</h2>
            <div className="form-group">
              <label>Seuil d'alerte stock par défaut</label>
              <input
                type="number"
                value={getValue('default_stock_alert')}
                onChange={(e) => handleInputChange('default_stock_alert', e.target.value)}
                min="0"
                step="0.1"
              />
              <small>Seuil d'alerte appliqué par défaut lors de la création d'un produit</small>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={getValue('allow_negative_stock') === 'true' || getValue('allow_negative_stock') === true}
                  onChange={(e) => handleInputChange('allow_negative_stock', e.target.checked ? 'true' : 'false')}
                />
                Autoriser les stocks négatifs
              </label>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="settings-section">
            <h2>Configuration Taxes</h2>
            <div className="form-group">
              <label>Taux TVA par défaut (%)</label>
              <input
                type="number"
                value={getValue('default_tva_rate')}
                onChange={(e) => handleInputChange('default_tva_rate', e.target.value)}
                min="0"
                step="0.1"
                placeholder="5.5"
              />
              <small>Taux TVA appliqué par défaut lors de la création d'un produit</small>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="settings-section">
            <h2>Configuration Commandes</h2>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={getValue('order_auto_generate_invoice') === 'true' || getValue('order_auto_generate_invoice') === true}
                  onChange={(e) => handleInputChange('order_auto_generate_invoice', e.target.checked ? 'true' : 'false')}
                />
                Générer automatiquement les factures
              </label>
            </div>
            <div className="form-group">
              <label>Montant minimum de commande (€)</label>
              <input
                type="number"
                value={getValue('order_min_amount')}
                onChange={(e) => handleInputChange('order_min_amount', e.target.value)}
                min="0"
                step="0.01"
              />
              <small>Montant minimum requis pour passer une commande</small>
            </div>
          </div>
        )}
      </div>

      <div className="settings-actions">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
