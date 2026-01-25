import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Mail, Lock, User, Building2, MapPin, Phone } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getDefaultRouteForRole } from '../../constants/routes'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { register, resendVerificationEmail } from '../../api/auth'

/**
 * Page de connexion
 */
function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { toast, hideToast, showError, showSuccess } = useToast()
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  })
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    shopName: '',
    address: '',
    city: '',
    postalCode: '',
  })
  const [loading, setLoading] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(loginData.email, loginData.password)
      if (result.success) {
        const defaultRoute = getDefaultRouteForRole(result.user.role)
        navigate(defaultRoute)
      } else {
        // Vérifier si c'est une erreur d'approbation
        if (result.requiresAdminApproval) {
          showError('Votre compte est en attente d\'approbation par un administrateur. Vous recevrez un email une fois votre compte approuvé.')
        } else if (result.requiresEmailVerification) {
          setShowEmailVerification(true)
          showError('Votre adresse email n\'a pas été vérifiée. Veuillez vérifier votre boîte mail et cliquer sur le lien de confirmation.')
        } else {
          setShowEmailVerification(false)
          showError(result.error || 'Email ou mot de passe incorrect')
        }
      }
    } catch (error) {
      showError('Erreur lors de la connexion')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      showError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (registerData.password.length < 6) {
      showError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    try {
      const result = await register({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone || undefined,
        shopName: registerData.shopName,
        address: registerData.address,
        city: registerData.city,
        postalCode: registerData.postalCode,
      })

      if (result.success) {
        showSuccess('Inscription réussie ! Un email de confirmation a été envoyé. Votre compte sera activé après approbation par un administrateur.')
        setIsRegisterMode(false)
        setRegisterData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          shopName: '',
          address: '',
          city: '',
          postalCode: '',
        })
      } else {
        showError(result.message || 'Erreur lors de l\'inscription')
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de l\'inscription')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className={isRegisterMode ? 'max-w-2xl w-full' : 'max-w-md w-full'}>
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isRegisterMode ? 'Créer un compte' : 'Connexion'}
            </h1>
            <p className="text-gray-600">
              {isRegisterMode 
                ? 'Créez votre compte pour commencer' 
                : 'Connectez-vous à votre compte'}
            </p>
          </div>

          {/* Toggle Login/Register */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !isRegisterMode
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isRegisterMode
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Inscription
              </button>
            </div>
          </div>

          {!isRegisterMode ? (
            /* Formulaire de connexion */
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="input pl-10"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="input pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Connexion...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Se connecter</span>
                  </>
                )}
              </button>

              {showEmailVerification && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-3">
                    Votre adresse email n'a pas été vérifiée. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      setResendingEmail(true)
                      try {
                        await resendVerificationEmail(loginData.email)
                        showSuccess('Un nouvel email de vérification a été envoyé. Vérifiez votre boîte mail.')
                      } catch (error) {
                        const msg = error?.message || ''
                        if (msg.toLowerCase().includes('déjà vérifié')) {
                          showSuccess('Votre email est déjà vérifié. Vous pouvez vous connecter.')
                          setShowEmailVerification(false)
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
            </form>
          ) : (
            /* Formulaire d'inscription */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      className="input pl-10"
                      placeholder="Jean Dupont"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="input pl-10"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="input pl-10"
                      placeholder="0612345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom du magasin *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={registerData.shopName}
                      onChange={(e) => setRegisterData({ ...registerData, shopName: e.target.value })}
                      className="input pl-10"
                      placeholder="Épicerie du Centre"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={registerData.address}
                      onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                      className="input pl-10"
                      placeholder="123 Rue de la République"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={registerData.city}
                    onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })}
                    className="input"
                    placeholder="Paris"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    value={registerData.postalCode}
                    onChange={(e) => setRegisterData({ ...registerData, postalCode: e.target.value })}
                    className="input"
                    placeholder="75001"
                    pattern="[0-9]{5}"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="input pl-10"
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="input pl-10"
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> Après votre inscription, vous recevrez un email de confirmation. 
                  Votre compte devra également être approuvé par un administrateur avant de pouvoir vous connecter.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary flex items-center justify-center space-x-2 mt-6"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Inscription...</span>
                  </>
                ) : (
                  <>
                    <User className="h-5 w-5" />
                    <span>Créer mon compte</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Toast */}
        <Toast {...toast} onClose={hideToast} />
      </div>
    </div>
  )
}

export default Login
