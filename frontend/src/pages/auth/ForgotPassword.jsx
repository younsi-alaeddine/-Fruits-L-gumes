import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { requestPasswordReset } from '../../api/auth'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { ROUTES } from '../../constants/routes'

export default function ForgotPassword() {
  const { toast, hideToast, showError, showSuccess } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await requestPasswordReset(email)
      // Toujours afficher un message générique (anti-enumération)
      showSuccess('Si ce compte existe, un email de réinitialisation a été envoyé.')
    } catch (error) {
      showError(error?.message || 'Erreur lors de la demande de réinitialisation')
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

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe oublié</h1>
          <p className="text-gray-600 mb-6">
            Entrez votre email. Nous vous enverrons un lien de réinitialisation.
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  className="input pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </form>
        </div>

        <Toast toast={toast} onClose={hideToast} />
      </div>
    </div>
  )
}

