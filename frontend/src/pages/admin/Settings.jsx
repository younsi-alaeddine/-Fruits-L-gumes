import React, { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  Save, 
  User, 
  Bell, 
  Lock, 
  Building, 
  Globe,
  Camera,
  Shield,
  Check,
  X,
  FileText,
  Mail
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { updateUserProfile, changeUserPassword, uploadProfileAvatar } from '../../api/users'
import { resendVerificationEmail, getMe } from '../../api/auth'
import { getSettings, updateSettings } from '../../api/settings'

/**
 * Page de paramètres ADMIN avec design moderne et animations
 */
function AdminSettings() {
  const { user } = useAuth()
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = React.useRef(null)

  // Extraire firstName et lastName du nom complet
  const nameParts = user?.name?.split(' ') || []
  const [profile, setProfile] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })

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
    users: true,
    stores: true,
  })

  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  const [systemSettings, setSystemSettings] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
    companyCity: '',
    companyPostalCode: '',
    companyCountry: 'FR',
    companySIRET: '',
    companyVAT: '',
    defaultCurrency: 'EUR',
    taxRate: 20,
    lowStockThreshold: 10,
    autoAssignOrders: false,
    orderDeadlineHour: 18,
    orderDeadlineMinute: 0,
    deliveryDays: 2,
    invoicePrefix: 'FAC',
    invoiceStartNumber: 1,
  })

  const [fiscalSettings, setFiscalSettings] = useState({
    tvaRate: 20,
    tvaRateReduced: 5.5,
    tvaRateSuperReduced: 2.1,
    invoiceFooter: '',
    invoiceTerms: '',
    paymentTerms: '30',
  })

  // Rafraîchir le user (dont emailVerified) à chaque visite de Settings
  useEffect(() => {
    getMe().catch(() => {})
  }, [])

  // Charger les settings au montage
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getSettings()
      const settings = data.settings || {}
      
      // Si settings est vide, ne pas essayer de charger les données
      if (!settings || Object.keys(settings).length === 0) return
      
      // Grouper par catégorie
      if (settings.general) {
        setSystemSettings(prev => ({
          ...prev,
          companyName: settings.general.find(s => s.key === 'company.name')?.value || prev.companyName,
          companyEmail: settings.general.find(s => s.key === 'company.email')?.value || prev.companyEmail,
          companyPhone: settings.general.find(s => s.key === 'company.phone')?.value || prev.companyPhone,
          companyAddress: settings.general.find(s => s.key === 'company.address')?.value || '',
          companyCity: settings.general.find(s => s.key === 'company.city')?.value || '',
          companyPostalCode: settings.general.find(s => s.key === 'company.postalCode')?.value || '',
          companyCountry: settings.general.find(s => s.key === 'company.country')?.value || 'FR',
          companySIRET: settings.general.find(s => s.key === 'company.siret')?.value || '',
          companyVAT: settings.general.find(s => s.key === 'company.vat')?.value || '',
          defaultCurrency: settings.general.find(s => s.key === 'currency.default')?.value || 'EUR',
          lowStockThreshold: parseInt(settings.general.find(s => s.key === 'stock.lowThreshold')?.value || '10'),
          autoAssignOrders: settings.general.find(s => s.key === 'orders.autoAssign')?.value === 'true',
          orderDeadlineHour: parseInt(settings.general.find(s => s.key === 'orders.deadlineHour')?.value || '18'),
          orderDeadlineMinute: parseInt(settings.general.find(s => s.key === 'orders.deadlineMinute')?.value || '0'),
          deliveryDays: parseInt(settings.general.find(s => s.key === 'delivery.days')?.value || '2'),
        }))
      }
      
      if (settings.fiscal) {
        setFiscalSettings(prev => ({
          ...prev,
          tvaRate: parseFloat(settings.fiscal.find(s => s.key === 'tva.rate')?.value || '20'),
          tvaRateReduced: parseFloat(settings.fiscal.find(s => s.key === 'tva.rateReduced')?.value || '5.5'),
          tvaRateSuperReduced: parseFloat(settings.fiscal.find(s => s.key === 'tva.rateSuperReduced')?.value || '2.1'),
          invoiceFooter: settings.fiscal.find(s => s.key === 'invoice.footer')?.value || '',
          invoiceTerms: settings.fiscal.find(s => s.key === 'invoice.terms')?.value || '',
          paymentTerms: settings.fiscal.find(s => s.key === 'payment.terms')?.value || '30',
        }))
      }
    } catch (error) {
      console.error('Erreur chargement settings:', error)
      // Ne pas bloquer l'interface si les settings ne peuvent pas être chargés
      // Les valeurs par défaut seront utilisées
      showError('Impossible de charger les paramètres. Les valeurs par défaut seront utilisées.')
    }
  }

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
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulation
      
      const profileData = {
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.name,
        phone: profile.phone || null,
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

  const handleSaveSystemSettings = async () => {
    setSaving(true)
    try {
      const settingsToUpdate = [
        { key: 'company.name', value: systemSettings.companyName },
        { key: 'company.email', value: systemSettings.companyEmail },
        { key: 'company.phone', value: systemSettings.companyPhone },
        { key: 'company.address', value: systemSettings.companyAddress },
        { key: 'company.city', value: systemSettings.companyCity },
        { key: 'company.postalCode', value: systemSettings.companyPostalCode },
        { key: 'company.country', value: systemSettings.companyCountry },
        { key: 'company.siret', value: systemSettings.companySIRET },
        { key: 'company.vat', value: systemSettings.companyVAT },
        { key: 'currency.default', value: systemSettings.defaultCurrency },
        { key: 'stock.lowThreshold', value: systemSettings.lowStockThreshold.toString() },
        { key: 'orders.autoAssign', value: systemSettings.autoAssignOrders.toString() },
        { key: 'orders.deadlineHour', value: systemSettings.orderDeadlineHour.toString() },
        { key: 'orders.deadlineMinute', value: systemSettings.orderDeadlineMinute.toString() },
        { key: 'delivery.days', value: systemSettings.deliveryDays.toString() },
      ]
      
      await updateSettings(settingsToUpdate)
      showSuccess('Paramètres système sauvegardés avec succès')
    } catch (error) {
      showError('Erreur lors de la sauvegarde des paramètres')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFiscalSettings = async () => {
    setSaving(true)
    try {
      const settingsToUpdate = [
        { key: 'tva.rate', value: fiscalSettings.tvaRate.toString() },
        { key: 'tva.rateReduced', value: fiscalSettings.tvaRateReduced.toString() },
        { key: 'tva.rateSuperReduced', value: fiscalSettings.tvaRateSuperReduced.toString() },
        { key: 'invoice.footer', value: fiscalSettings.invoiceFooter },
        { key: 'invoice.terms', value: fiscalSettings.invoiceTerms },
        { key: 'payment.terms', value: fiscalSettings.paymentTerms },
      ]
      
      await updateSettings(settingsToUpdate)
      showSuccess('Paramètres fiscaux sauvegardés avec succès')
    } catch (error) {
      showError('Erreur lors de la sauvegarde')
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
    { id: 'system', label: 'Système', icon: Building },
    { id: 'fiscal', label: 'Fiscalité', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header intégré avec tabs */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Paramètres</h1>
          <p className="text-gray-600">Gestion des paramètres système et de votre compte</p>
        </div>
        {/* Tabs Navigation - Version compacte */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab, index) => {
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
                <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
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
                {user && !user.emailVerified && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-2">
                      ⚠️ Votre adresse email n'a pas été vérifiée
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        setResendingEmail(true)
                        try {
                          await resendVerificationEmail(user.email)
                          showSuccess('Un nouvel email de vérification a été envoyé. Vérifiez votre boîte mail.')
                        } catch (error) {
                          const msg = error?.message || ''
                          if (msg.toLowerCase().includes('déjà vérifié')) {
                            try {
                              await getMe()
                            } catch (_) { /* ignore */ }
                            showSuccess('Votre email est déjà vérifié.')
                          } else {
                            showError(msg || 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.')
                          }
                        } finally {
                          setResendingEmail(false)
                        }
                      }}
                      disabled={resendingEmail}
                      className="w-full btn btn-secondary text-sm flex items-center justify-center space-x-2"
                    >
                      {resendingEmail ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          <span>Envoi...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          <span>Renvoyer l'email de vérification</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold">
                  <Shield className="h-4 w-4 mr-1" />
                  Administrateur
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
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
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

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="animate-scale-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <Building className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Paramètres Système</h2>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-200 card-hover shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-blue-600" />
                  Informations de l'entreprise
                </h3>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
                    <input
                      type="text"
                      value={systemSettings.companyAddress}
                      onChange={(e) => setSystemSettings({ ...systemSettings, companyAddress: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
                    <input
                      type="text"
                      value={systemSettings.companyCity}
                      onChange={(e) => setSystemSettings({ ...systemSettings, companyCity: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Code postal</label>
                    <input
                      type="text"
                      value={systemSettings.companyPostalCode}
                      onChange={(e) => setSystemSettings({ ...systemSettings, companyPostalCode: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pays</label>
                    <select
                      value={systemSettings.companyCountry}
                      onChange={(e) => setSystemSettings({ ...systemSettings, companyCountry: e.target.value })}
                      className="input"
                    >
                      <option value="FR">France</option>
                      <option value="BE">Belgique</option>
                      <option value="CH">Suisse</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SIRET</label>
                    <input
                      type="text"
                      value={systemSettings.companySIRET}
                      onChange={(e) => setSystemSettings({ ...systemSettings, companySIRET: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">N° TVA</label>
                    <input
                      type="text"
                      value={systemSettings.companyVAT}
                      onChange={(e) => setSystemSettings({ ...systemSettings, companyVAT: e.target.value })}
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
              </div>

              <div className="p-6 bg-gradient-to-br from-orange-50 to-white rounded-xl border-2 border-orange-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <SettingsIcon className="h-5 w-5 mr-2 text-orange-600" />
                  Paramètres opérationnels
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Délai de livraison (jours)</label>
                    <input
                      type="number"
                      value={systemSettings.deliveryDays}
                      onChange={(e) => setSystemSettings({ ...systemSettings, deliveryDays: parseInt(e.target.value) })}
                      className="input"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Heure limite commande</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={systemSettings.orderDeadlineHour}
                        onChange={(e) => setSystemSettings({ ...systemSettings, orderDeadlineHour: parseInt(e.target.value) })}
                        className="input flex-1"
                        min="0"
                        max="23"
                        placeholder="Heure"
                      />
                      <span className="self-center">:</span>
                      <input
                        type="number"
                        value={systemSettings.orderDeadlineMinute}
                        onChange={(e) => setSystemSettings({ ...systemSettings, orderDeadlineMinute: parseInt(e.target.value) })}
                        className="input flex-1"
                        min="0"
                        max="59"
                        placeholder="Minute"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                        <Building className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Assignation automatique des commandes</p>
                        <p className="text-sm text-gray-600">Les commandes seront automatiquement assignées aux magasins</p>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={systemSettings.autoAssignOrders}
                        onChange={(e) => setSystemSettings({ ...systemSettings, autoAssignOrders: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button 
                  onClick={handleSaveSystemSettings} 
                  disabled={saving}
                  className="group btn-ripple relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 disabled:opacity-50"
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

        {/* Fiscal Tab */}
        {activeTab === 'fiscal' && (
          <div className="animate-scale-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Paramètres Fiscaux</h2>
            </div>

            <div className="space-y-6">
              {/* TVA */}
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-xl border-2 border-indigo-200 card-hover shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                  Taux de TVA
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Taux normal (%)</label>
                    <input
                      type="number"
                      value={fiscalSettings.tvaRate}
                      onChange={(e) => setFiscalSettings({ ...fiscalSettings, tvaRate: parseFloat(e.target.value) })}
                      className="input"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Taux réduit (%)</label>
                    <input
                      type="number"
                      value={fiscalSettings.tvaRateReduced}
                      onChange={(e) => setFiscalSettings({ ...fiscalSettings, tvaRateReduced: parseFloat(e.target.value) })}
                      className="input"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Taux super réduit (%)</label>
                    <input
                      type="number"
                      value={fiscalSettings.tvaRateSuperReduced}
                      onChange={(e) => setFiscalSettings({ ...fiscalSettings, tvaRateSuperReduced: parseFloat(e.target.value) })}
                      className="input"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Facturation */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-200 card-hover shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Paramètres de facturation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Préfixe facture</label>
                    <input
                      type="text"
                      value={systemSettings.invoicePrefix}
                      onChange={(e) => setSystemSettings({ ...systemSettings, invoicePrefix: e.target.value })}
                      className="input"
                      placeholder="FAC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro de départ</label>
                    <input
                      type="number"
                      value={systemSettings.invoiceStartNumber}
                      onChange={(e) => setSystemSettings({ ...systemSettings, invoiceStartNumber: parseInt(e.target.value) })}
                      className="input"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Délai de paiement (jours)</label>
                    <input
                      type="number"
                      value={fiscalSettings.paymentTerms}
                      onChange={(e) => setFiscalSettings({ ...fiscalSettings, paymentTerms: e.target.value })}
                      className="input"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Textes factures */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-white rounded-xl border-2 border-green-200 card-hover shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Textes personnalisés
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pied de page facture</label>
                    <textarea
                      value={fiscalSettings.invoiceFooter}
                      onChange={(e) => setFiscalSettings({ ...fiscalSettings, invoiceFooter: e.target.value })}
                      className="input"
                      rows="3"
                      placeholder="Merci de votre confiance..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Conditions générales</label>
                    <textarea
                      value={fiscalSettings.invoiceTerms}
                      onChange={(e) => setFiscalSettings({ ...fiscalSettings, invoiceTerms: e.target.value })}
                      className="input"
                      rows="4"
                      placeholder="Conditions de vente, modalités de paiement..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button 
                  onClick={handleSaveFiscalSettings} 
                  disabled={saving}
                  className="group btn-ripple relative overflow-hidden bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 disabled:opacity-50"
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

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="animate-scale-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
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
                    { key: 'users', label: 'Gestion des utilisateurs', color: 'purple' },
                    { key: 'stores', label: 'Gestion des magasins', color: 'green' },
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

              <div className="flex justify-end pt-4 border-t border-gray-200">
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

export default AdminSettings
