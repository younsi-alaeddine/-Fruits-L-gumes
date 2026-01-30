import React, { useState, useEffect, useRef } from 'react'
import { Save, User, Bell, Lock, Camera } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { updateUserProfile, changeUserPassword, uploadProfileAvatar } from '../../api/users'
import { getMe } from '../../api/auth'

/**
 * Page Paramètres MANAGER
 */
function ManagerSettings() {
  const { user } = useAuth()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
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

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const profileData = {
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.name,
        phone: profile.phone || null,
      }
      
      await updateUserProfile(profileData)
      showSuccess('Profil mis à jour')
    } catch (error) {
      showError('Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (password.new !== password.confirm) {
      showError('Les mots de passe ne correspondent pas')
      return
    }
    setSaving(true)
    try {
      await changeUserPassword(password.current, password.new)
      showSuccess('Mot de passe modifié')
      setPassword({ current: '', new: '', confirm: '' })
    } catch (error) {
      showError('Erreur')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Lock },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Paramètres</h1>
          <p className="text-gray-600">Gestion de votre compte</p>
        </div>
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

      <div>
        {activeTab === 'profile' && (
          <div className="animate-scale-in space-y-4 p-6 bg-white rounded-xl shadow-md card-hover">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
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
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
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
                  className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow border-2 border-primary-500 hover:bg-gray-50 disabled:opacity-50"
                  title="Changer la photo"
                >
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary-500 border-t-transparent" />
                  ) : (
                    <Camera className="h-3 w-3 text-primary-600" />
                  )}
                </button>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{user?.name || `${profile.firstName} ${profile.lastName}`.trim()}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom *</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom *</label>
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
                <input type="email" value={profile.email} className="input bg-gray-50" disabled />
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
            <div className="flex justify-end pt-4">
              <button onClick={handleSaveProfile} disabled={saving} className="btn btn-primary">
                {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="animate-scale-in space-y-4 p-6 bg-white rounded-xl shadow-md card-hover">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe actuel *</label>
              <input
                type="password"
                value={password.current}
                onChange={(e) => setPassword({ ...password, current: e.target.value })}
                className="input"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau mot de passe *</label>
                <input
                  type="password"
                  value={password.new}
                  onChange={(e) => setPassword({ ...password, new: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer *</label>
                <input
                  type="password"
                  value={password.confirm}
                  onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={handleChangePassword} disabled={saving} className="btn btn-danger">
                {saving ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Toast {...toast} onClose={hideToast} />
    </div>
  )
}

export default ManagerSettings
