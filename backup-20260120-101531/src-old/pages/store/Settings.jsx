import React, { useState, useEffect } from 'react'
import { Settings, Save, User, Bell, Lock, Building, MapPin, Phone, Mail } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { updateUserProfile, changeUserPassword } from '../../api/users'
import { updateStore, getStore } from '../../api/stores'

/**
 * Page de paramètres MAGASIN
 */
function StoreSettings() {
  const { user } = useAuth()
  const { activeStore, loadStores } = useStore()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  const [storeSettings, setStoreSettings] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      zipCode: '',
      country: 'France',
    },
  })

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    orders: true,
    stocks: true,
    deliveries: true,
  })

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  useEffect(() => {
    if (activeStore) {
      loadStoreData()
    }
  }, [activeStore])

  const loadStoreData = async () => {
    if (!activeStore?.id) return

    try {
      const store = await getStore(activeStore.id)
      if (store) {
        setStoreSettings({
          name: store.name || '',
          code: store.code || '',
          phone: store.phone || '',
          email: store.email || '',
          address: store.address || {
            street: '',
            city: '',
            zipCode: '',
            country: 'France',
          },
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du magasin:', error)
    }
  }

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

  const handleSaveStoreSettings = async () => {
    if (!activeStore?.id) {
      showError('Aucun magasin sélectionné')
      return
    }

    try {
      await updateStore(activeStore.id, storeSettings)
      showSuccess('Paramètres du magasin sauvegardés avec succès')
      loadStores() // Recharger la liste des magasins
    } catch (error) {
      showError('Erreur lors de la sauvegarde des paramètres')
      console.error(error)
    }
  }

  if (!activeStore) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Veuillez sélectionner un magasin</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres</h1>
          <p className="text-gray-600">Gestion des paramètres du magasin et de votre compte</p>
        </div>
      </div>

      {/* Section Paramètres du Magasin */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <Building className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Informations du Magasin</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du magasin *</label>
              <input
                type="text"
                value={storeSettings.name}
                onChange={(e) => setStoreSettings({ ...storeSettings, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Code du magasin *</label>
              <input
                type="text"
                value={storeSettings.code}
                onChange={(e) => setStoreSettings({ ...storeSettings, code: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={storeSettings.phone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={storeSettings.email}
                  onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
            <div className="relative mb-2">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={storeSettings.address.street}
                onChange={(e) => setStoreSettings({
                  ...storeSettings,
                  address: { ...storeSettings.address, street: e.target.value }
                })}
                className="input pl-10"
                placeholder="Rue"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={storeSettings.address.zipCode}
                onChange={(e) => setStoreSettings({
                  ...storeSettings,
                  address: { ...storeSettings.address, zipCode: e.target.value }
                })}
                className="input"
                placeholder="Code postal"
              />
              <input
                type="text"
                value={storeSettings.address.city}
                onChange={(e) => setStoreSettings({
                  ...storeSettings,
                  address: { ...storeSettings.address, city: e.target.value }
                })}
                className="input"
                placeholder="Ville"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button onClick={handleSaveStoreSettings} className="btn btn-primary flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Enregistrer</span>
            </button>
          </div>
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
                checked={notifications.deliveries}
                onChange={(e) => setNotifications({ ...notifications, deliveries: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Livraisons</span>
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

export default StoreSettings
