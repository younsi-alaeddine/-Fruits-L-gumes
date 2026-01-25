import React, { useState } from 'react'
import { Settings, Save, User, Bell, Lock, Building, Globe } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { updateUserProfile, changeUserPassword } from '../../api/users'

/**
 * Page de paramètres ADMIN
 */
function AdminSettings() {
  const { user } = useAuth()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    orders: true,
    stocks: true,
    users: true,
    stores: true,
  })

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const [systemSettings, setSystemSettings] = useState({
    companyName: 'Fruits & Légumes Pro',
    companyEmail: 'contact@fruitslegumes-pro.fr',
    companyPhone: '+33 1 23 45 67 89',
    defaultCurrency: 'EUR',
    taxRate: 20,
    lowStockThreshold: 10,
    autoAssignOrders: false,
  })

  const handleSaveProfile = async () => {
    try {
      if (!user?.id) {
        showError('Utilisateur non identifié')
        return
      }
      await updateUserProfile(user.id, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      })
      showSuccess('Profil mis à jour avec succès')
    } catch (error) {
      showError('Erreur lors de la mise à jour du profil')
      console.error(error)
    }
  }

  const handleChangePassword = async () => {
    if (password.new !== password.confirm) {
      showError('Les mots de passe ne correspondent pas')
      return
    }
    if (password.new.length < 8) {
      showError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    try {
      if (!user?.id) {
        showError('Utilisateur non identifié')
        return
      }
      await changeUserPassword(user.id, password.current, password.new)
      showSuccess('Mot de passe modifié avec succès')
      setPassword({ current: '', new: '', confirm: '' })
    } catch (error) {
      showError('Erreur lors de la modification du mot de passe')
      console.error(error)
    }
  }

  const handleSaveSystemSettings = async () => {
    try {
      // TODO: Sauvegarder les paramètres système via API
      showSuccess('Paramètres système sauvegardés avec succès')
    } catch (error) {
      showError('Erreur lors de la sauvegarde des paramètres')
      console.error(error)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres</h1>
          <p className="text-gray-600">Gestion des paramètres système et de votre compte</p>
        </div>
      </div>

      {/* Section Profil */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <User className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Profil</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input type="email" value={profile.email} className="input" disabled />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button onClick={handleSaveProfile} className="btn btn-primary flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section Mot de passe */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Lock className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Mot de passe</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={password.current}
              onChange={(e) => setPassword({ ...password, current: e.target.value })}
              className="input"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={password.new}
                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button onClick={handleChangePassword} className="btn btn-primary">
              Modifier le mot de passe
            </button>
          </div>
        </div>
      </div>

      {/* Section Paramètres Système */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Building className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Paramètres Système</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de l'entreprise</label>
              <input
                type="text"
                value={systemSettings.companyName}
                onChange={(e) => setSystemSettings({ ...systemSettings, companyName: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email de contact</label>
              <input
                type="email"
                value={systemSettings.companyEmail}
                onChange={(e) => setSystemSettings({ ...systemSettings, companyEmail: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
              <input
                type="tel"
                value={systemSettings.companyPhone}
                onChange={(e) => setSystemSettings({ ...systemSettings, companyPhone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Devise par défaut</label>
              <select
                value={systemSettings.defaultCurrency}
                onChange={(e) => setSystemSettings({ ...systemSettings, defaultCurrency: e.target.value })}
                className="input"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Taux de TVA (%)</label>
              <input
                type="number"
                value={systemSettings.taxRate}
                onChange={(e) => setSystemSettings({ ...systemSettings, taxRate: parseFloat(e.target.value) })}
                className="input"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Seuil d'alerte stock</label>
              <input
                type="number"
                value={systemSettings.lowStockThreshold}
                onChange={(e) => setSystemSettings({ ...systemSettings, lowStockThreshold: parseInt(e.target.value) })}
                className="input"
                min="0"
              />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={systemSettings.autoAssignOrders}
                onChange={(e) => setSystemSettings({ ...systemSettings, autoAssignOrders: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-semibold text-gray-700">Assignation automatique des commandes</span>
            </label>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button onClick={handleSaveSystemSettings} className="btn btn-primary flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section Notifications */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-semibold text-gray-700">Notifications par email</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={notifications.sms}
              onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-semibold text-gray-700">Notifications par SMS</span>
          </label>
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <p className="text-sm font-semibold text-gray-700 mb-2">Recevoir des notifications pour :</p>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={notifications.orders}
                onChange={(e) => setNotifications({ ...notifications, orders: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Nouvelles commandes</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={notifications.stocks}
                onChange={(e) => setNotifications({ ...notifications, stocks: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Alertes de stock</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={notifications.users}
                onChange={(e) => setNotifications({ ...notifications, users: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Création/modification d'utilisateurs</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={notifications.stores}
                onChange={(e) => setNotifications({ ...notifications, stores: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Création/modification de magasins</span>
            </label>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button onClick={() => showSuccess('Préférences sauvegardées')} className="btn btn-primary flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  )
}

export default AdminSettings
