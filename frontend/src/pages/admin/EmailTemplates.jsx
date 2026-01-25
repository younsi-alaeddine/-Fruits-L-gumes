import React, { useState, useEffect } from 'react'
import { Mail, Plus, Edit, Trash2 } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import { getEmailTemplates } from '../../api/emails'

function AdminEmailTemplates() {
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await getEmailTemplates()
      // Si l'API retourne juste une liste de types, créer des templates par défaut
      if (response.templates && Array.isArray(response.templates)) {
        const defaultTemplates = response.templates.map((type, index) => ({
          id: index + 1,
          name: getTemplateName(type),
          type: type
        }))
        setTemplates(defaultTemplates)
      } else if (response.data) {
        setTemplates(response.data)
      } else {
        // Fallback si l'API n'est pas encore implémentée
        setTemplates([
          { id: 1, name: 'Confirmation de commande', type: 'order-confirmation' },
          { id: 2, name: 'Facture', type: 'invoice' },
          { id: 3, name: 'Notification de livraison', type: 'delivery-notification' },
          { id: 4, name: 'Réinitialisation de mot de passe', type: 'password-reset' }
        ])
      }
    } catch (error) {
      console.error('Erreur chargement templates', error)
      // Fallback en cas d'erreur
      setTemplates([
        { id: 1, name: 'Confirmation de commande', type: 'order-confirmation' },
        { id: 2, name: 'Facture', type: 'invoice' },
        { id: 3, name: 'Notification de livraison', type: 'delivery-notification' },
        { id: 4, name: 'Réinitialisation de mot de passe', type: 'password-reset' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getTemplateName = (type) => {
    const names = {
      'order-confirmation': 'Confirmation de commande',
      'invoice': 'Facture',
      'delivery-notification': 'Notification de livraison',
      'password-reset': 'Réinitialisation de mot de passe'
    }
    return names[type] || type
  }

  return (
    <div className="space-y-6">
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            Templates d'emails
          </h1>
          <p className="text-gray-600">Gérez les modèles d'emails envoyés aux clients</p>
        </div>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nouveau template</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900">{template.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {template.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      )}

      {!loading && templates.length === 0 && (
        <div className="text-center py-12">
          <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun template d'email trouvé</p>
        </div>
      )}

      {/* Modal Création (simplifié) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Nouveau template</h3>
            <p className="text-gray-600 mb-4">
              La création de templates personnalisés sera disponible prochainement.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary w-full"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminEmailTemplates
