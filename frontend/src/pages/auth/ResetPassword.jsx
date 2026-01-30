import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Lock } from 'lucide-react'
import { resetPassword } from '../../api/auth'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { ROUTES } from '../../constants/routes'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token') || '', [params])
  const { toast, hideToast, showError, showSuccess } = useToast()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      showError('Token manquant dans le lien de réinitialisation.')
      return
    }
    if (password.length < 8) {
      showError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirmPassword) {
      showError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      showSuccess('Mot de passe modifié. Vous pouvez vous connecter.')
      setTimeout(() => navigate(ROUTES.LOGIN), 800)
    } catch (error) {
      showError(error?.message || 'Erreur lors de la réinitialisation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <Link to={ROUTES.LOGIN} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour connexion
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Réinitialiser le mot de passe</h1>
          <p className="text-gray-600 mb-6">
            Choisissez un nouveau mot de passe.
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  className="input pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  className="input pl-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              {loading ? 'Mise à jour…' : 'Mettre à jour'}
            </button>
          </form>
        </div>

        <Toast toast={toast} onClose={hideToast} />
      </div>
    </div>
  )
}

