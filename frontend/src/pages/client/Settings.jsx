import React, { useState, useEffect } from 'react'
import { Save, User, Bell, Lock, Camera, Shield, Check, X, Mail } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { updateUserProfile, changeUserPassword, uploadProfileAvatar } from '../../api/users'
import { resendVerificationEmail, getMe } from '../../api/auth'

/**
 * Page de paramètres CLIENT avec design moderne et onglets
 */
function ClientSettings() {
  const { user } = useAuth()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef(null)

  // Extraire firstName et lastName du nom complet
  const nameParts = user?.name?.split(' ') || []
  const [profile, setProfile] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

  // Rafraîchir le user (dont emailVerified) à chaque visite de Settings
  useEffect(() => {
    getMe().catch(() => {})
  }, [])

  // Mettre à jour le formulaire quand user change
  useEffect(() => {
    if (user) {
      const nameParts = user.name?.split(' ') || []
      setProfile({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user])

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

  // Calculer la force du mot de passe
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: '', color: '' }
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z\d]/.test(pwd)) strength++

    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Très faible', color: 'bg-red-500' },
      { strength: 2, label: 'Faible', color: 'bg-orange-500' },
      { strength: 3, label: 'Moyen', color: 'bg-yellow-500' },
      { strength: 4, label: 'Fort', color: 'bg-primary-500' },
      { strength: 5, label: 'Très fort', color: 'bg-green-500' },
    ]
    return levels[strength]
  }

  const passwordStrength = getPasswordStrength(password.new)

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      if (!user?.id) {
        showError('Utilisateur non identifié')
        return
      }
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const profileData = {
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.name,
        phone: profile.phone || null,
      }
      
      // Vérification avant l'envoi
      if (!profileData.name && !profileData.phone) {
        showError('Aucune donnée à mettre à jour')
        return
      }
      
      await updateUserProfile(profileData)
      showSuccess('Profil mis à jour avec succès')
    } catch (error) {
      showError('Erreur lors de la mise à jour du profil')
      console.error(error)
    } finally {
      setSaving(false)
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
    setSaving(true)
    try {
      if (!user?.id) {
        showError('Utilisateur non identifié')
        return
      }
      await new Promise(resolve => setTimeout(resolve, 500))
      await changeUserPassword(password.current, password.new)
      showSuccess('Mot de passe modifié avec succès')
      setPassword({ current: '', new: '', confirm: '' })
    } catch (error) {
      showError('Erreur lors de la modification du mot de passe')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      showSuccess('Préférences de notification sauvegardées')
    } catch (error) {
      showError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header intégré avec tabs */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Paramètres</h1>
          <p className="text-gray-600">Gestion de votre compte</p>
        </div>
        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Profil Tab */}
        {activeTab === 'profile' && (
          <div className="animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-md">
                  <User className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Mon Profil</h2>
              </div>
            </div>

            {/* Avatar Section */}
            <div className="flex items-center space-x-6 mb-8 p-6 bg-gradient-to-br from-primary-50 to-white rounded-xl border-2 border-primary-200 card-hover shadow-md">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploadingAvatar(true)
                  try {
                    await uploadProfileAvatar(file)
                    showSuccess('Photo de profil mise à jour.')
                  } catch (err) {
                    showError(err?.message || 'Erreur lors du téléversement.')
                  } finally {
                    setUploadingAvatar(false)
                    e.target.value = ''
                  }
                }}
              />
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden group-hover:scale-110 transition-transform">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{profile.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}{profile.lastName?.charAt(0) || (user?.name?.split(' ')[1]?.charAt(0)) || ''}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border-2 border-primary-500 hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title="Changer la photo"
                >
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent" />
                  ) : (
                    <Camera className="h-4 w-4 text-primary-600" />
                  )}
                </button>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{user?.name || `${profile.firstName} ${profile.lastName}`.trim()}</h3>
                <p className="text-gray-600">{user?.email}</p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                  <Shield className="h-4 w-4 mr-1" />
                  Client
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6 bg-white rounded-xl shadow-md card-hover">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="input"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="input"
                    placeholder="Votre nom"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    value={profile.email} 
                    className="input bg-gray-50 cursor-not-allowed" 
                    disabled 
                  />
                  <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="input"
                    placeholder="+33 X XX XX XX XX"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button 
                  onClick={handleSaveProfile} 
                  disabled={saving}
                  className="group btn-ripple relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span className="font-semibold">Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                      <span className="font-semibold">Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="animate-scale-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Sécurité</h2>
            </div>

            <div className="space-y-4 p-6 bg-white rounded-xl shadow-md card-hover">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe actuel *
                </label>
                <input
                  type="password"
                  value={password.current}
                  onChange={(e) => setPassword({ ...password, current: e.target.value })}
                  className="input"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    value={password.new}
                    onChange={(e) => setPassword({ ...password, new: e.target.value })}
                    className="input"
                    placeholder="••••••••"
                  />
                  {password.new && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">Force du mot de passe:</span>
                        <span className={`text-xs font-semibold ${passwordStrength.label === 'Très fort' ? 'text-green-600' : passwordStrength.label === 'Fort' ? 'text-primary-600' : 'text-orange-600'}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${passwordStrength.color} transition-all duration-500`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                    className="input"
                    placeholder="••••••••"
                  />
                  {password.confirm && (
                    <div className="mt-2 flex items-center space-x-2">
                      {password.new === password.confirm ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Les mots de passe correspondent</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-600" />
                          <span className="text-xs text-red-600 font-medium">Les mots de passe ne correspondent pas</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Password Requirements */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm font-semibold text-blue-900 mb-2">Exigences du mot de passe :</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${password.new.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {password.new.length >= 8 && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span>Au moins 8 caractères</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/[A-Z]/.test(password.new) && /[a-z]/.test(password.new) ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {/[A-Z]/.test(password.new) && /[a-z]/.test(password.new) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span>Majuscules et minuscules</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${/\d/.test(password.new) ? 'bg-green-500' : 'bg-gray-300'}`}>
                      {/\d/.test(password.new) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span>Au moins un chiffre</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button 
                  onClick={handleChangePassword}
                  disabled={saving || !password.current || !password.new || password.new !== password.confirm}
                  className="group btn-ripple relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span className="font-semibold">Modification...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                      <span className="font-semibold">Modifier le mot de passe</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="animate-scale-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Préférences de Notification</h2>
            </div>

            <div className="space-y-6">
              {/* Canaux de notification */}
              <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border-2 border-purple-200 card-hover shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Canaux de notification</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer group p-4 bg-white rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Bell className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Notifications par email</p>
                        <p className="text-sm text-gray-600">Recevoir des notifications par email</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={notifications.email}
                        onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group p-4 bg-white rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Bell className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Notifications par SMS</p>
                        <p className="text-sm text-gray-600">Recevoir des notifications par SMS</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={notifications.sms}
                        onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Types de notifications */}
              <div className="p-6 bg-gradient-to-br from-orange-50 to-white rounded-xl border-2 border-orange-200 card-hover shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Types de notifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'orders', label: 'Nouvelles commandes', color: 'blue' },
                    { key: 'stocks', label: 'Alertes de stock', color: 'orange' },
                    { key: 'finances', label: 'Rapports financiers', color: 'green' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between cursor-pointer group p-4 bg-white rounded-lg hover:shadow-md transition-all">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 bg-${item.color}-100 rounded-lg`}>
                          <Check className={`h-4 w-4 text-${item.color}-600`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={notifications[item.key]}
                          onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="group btn-ripple relative overflow-hidden bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span className="font-semibold">Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                      <span className="font-semibold">Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  )
}

export default ClientSettings
