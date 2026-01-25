import React, { useState } from 'react'
import { Settings, Save, User, Bell, Lock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { updateUserProfile, changeUserPassword } from '../../api/users'

/**
 * Page de paramètres CLIENT
 */
function ClientSettings() {
  const { user, login } = useAuth()
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
    finances: true,
  })

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres</h1>
          <p className="text-gray-600">Gestion de votre compte</p>
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
                checked={notifications.finances}
                onChange={(e) => setNotifications({ ...notifications, finances: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Rapports financiers</span>
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

export default ClientSettings
