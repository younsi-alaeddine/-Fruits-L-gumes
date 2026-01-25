import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { verifyEmail, getMe } from '../../api/auth'
import { getDefaultRouteForRole } from '../../constants/routes'
import { ROUTES } from '../../constants/routes'

/**
 * Page de vérification d'email (lien reçu par email)
 * Appelle l'API pour vérifier le token, puis rafraîchit l'utilisateur si connecté.
 */
function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Lien invalide : token manquant.')
      return
    }

    const run = async () => {
      try {
        await verifyEmail(token)
        setStatus('success')
        setMessage('Votre adresse email a été vérifiée avec succès.')

        const hasToken = !!localStorage.getItem('token')
        if (hasToken) {
          try {
            const data = await getMe()
            if (data?.user) {
              localStorage.setItem('user', JSON.stringify(data.user))
              window.dispatchEvent(new CustomEvent('userUpdated', { detail: data.user }))
            }
          } catch (e) {
            console.warn('Impossible de rafraîchir le profil:', e)
          }
        }
      } catch (err) {
        setStatus('error')
        const msg = err.response?.data?.message || err.message || 'Token invalide ou expiré.'
        setMessage(msg)
      }
    }

    run()
  }, [token])

  const handleGoToApp = () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        navigate(getDefaultRouteForRole(user.role) || ROUTES.ADMIN.DASHBOARD)
      } catch {
        navigate(ROUTES.LOGIN)
      }
    } else {
      navigate(ROUTES.LOGIN)
    }
  }

  const handleGoToLogin = () => {
    navigate(ROUTES.LOGIN)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 text-primary-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Vérification en cours...</h1>
            <p className="text-gray-600">Veuillez patienter.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Email vérifié</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              type="button"
              onClick={handleGoToApp}
              className="w-full btn btn-primary"
            >
              Continuer vers l&apos;application
            </button>
            {!localStorage.getItem('token') && (
              <button
                type="button"
                onClick={handleGoToLogin}
                className="w-full mt-3 btn btn-secondary"
              >
                Se connecter
              </button>
            )}
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              type="button"
              onClick={handleGoToLogin}
              className="w-full btn btn-primary"
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
