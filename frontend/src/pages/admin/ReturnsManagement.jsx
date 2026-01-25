import React, { useState, useEffect } from 'react'
import {
  RotateCcw, CheckCircle, XCircle, Eye, AlertTriangle, Package,
  FileText, DollarSign, Search, Filter, Image as ImageIcon
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import Modal from '../../components/common/Modal'
import {
  getReturns,
  getReturn,
  approveReturn,
  rejectReturn,
  getReturnStats
} from '../../api/returns'

function ReturnsManagement() {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast()
  
  const [returns, setReturns] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Modals
  const [detailsModal, setDetailsModal] = useState(false)
  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  
  // Données sélectionnées
  const [selectedReturn, setSelectedReturn] = useState(null)
  
  // Formulaires
  const [approveForm, setApproveForm] = useState({
    refundMethod: 'CREDIT_NOTE',
    notes: ''
  })
  
  const [rejectForm, setRejectForm] = useState({ reason: '' })

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      
      const [returnsData, statsData] = await Promise.all([
        getReturns(params),
        getReturnStats()
      ])
      
      setReturns(returnsData.returns || [])
      setStats(statsData.stats || {})
    } catch (error) {
      showError('Erreur lors du chargement des retours')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (returnItem) => {
    try {
      const data = await getReturn(returnItem.id)
      setSelectedReturn(data.return || returnItem)
      setDetailsModal(true)
    } catch (error) {
      showError('Erreur lors du chargement des détails')
    }
  }

  const handleApprove = async (e) => {
    e.preventDefault()
    try {
      await approveReturn(selectedReturn.id, approveForm)
      showSuccess('Retour approuvé avec succès')
      setApproveModal(false)
      setApproveForm({ refundMethod: 'CREDIT_NOTE', notes: '' })
      setSelectedReturn(null)
      loadData()
    } catch (error) {
      showError('Erreur lors de l\'approbation')
    }
  }

  const handleReject = async (e) => {
    e.preventDefault()
    try {
      await rejectReturn(selectedReturn.id, rejectForm.reason)
      showSuccess('Retour rejeté')
      setRejectModal(false)
      setRejectForm({ reason: '' })
      setSelectedReturn(null)
      loadData()
    } catch (error) {
      showError('Erreur lors du rejet')
    }
  }

  const getStatusBadge = (status) => {
    const configs = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approuvé' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejeté' },
      REFUNDED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Remboursé' },
      CREDITED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Avoir créé' }
    }
    const config = configs[status] || configs.PENDING
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const getReasonLabel = (reason) => {
    const labels = {
      DEFECTIVE: 'Produit défectueux',
      WRONG_PRODUCT: 'Mauvais produit',
      DAMAGED: 'Endommagé',
      EXPIRED: 'Périmé',
      NOT_ORDERED: 'Non commandé',
      QUALITY_ISSUE: 'Problème qualité',
      OTHER: 'Autre'
    }
    return labels[reason] || reason
  }

  const filteredReturns = (returns || []).filter(r => {
    const orderNumber = r.order?.orderNumber || ''
    const shopName = r.order?.shop?.name || ''
    const returnNumber = r.returnNumber || ''
    
    return (
      orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (loading && returns.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} hideToast={hideToast} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-900 to-red-600 bg-clip-text text-transparent">
            Gestion des Retours
          </h1>
          <p className="text-gray-600 mt-2">Retours produits et avoirs</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl p-4">
          <RotateCcw className="h-8 w-8 text-gray-500 mb-2" />
          <p className="text-sm text-gray-600 font-medium">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
          <p className="text-sm text-gray-600 font-medium">En attente</p>
          <p className="text-2xl font-bold text-gray-900">{stats.pending || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
          <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
          <p className="text-sm text-gray-600 font-medium">Approuvés</p>
          <p className="text-2xl font-bold text-gray-900">{stats.approved || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4">
          <XCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm text-gray-600 font-medium">Rejetés</p>
          <p className="text-2xl font-bold text-gray-900">{stats.rejected || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
          <DollarSign className="h-8 w-8 text-blue-500 mb-2" />
          <p className="text-sm text-gray-600 font-medium">Montant total</p>
          <p className="text-2xl font-bold text-gray-900">{(stats.totalAmount || 0).toFixed(2)} €</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvés</option>
            <option value="REJECTED">Rejetés</option>
            <option value="REFUNDED">Remboursés</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Retour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Magasin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raison</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReturns.map((returnItem) => (
                <tr key={returnItem.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {returnItem.returnNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{returnItem.order?.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{returnItem.order?.shop?.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{getReasonLabel(returnItem.reason)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-red-600">{(returnItem.totalAmount || 0).toFixed(2)} €</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(returnItem.requestedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(returnItem.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(returnItem)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      
                      {returnItem.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedReturn(returnItem)
                              setApproveForm({ refundMethod: 'CREDIT_NOTE', notes: '' })
                              setApproveModal(true)
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approuver"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReturn(returnItem)
                              setRejectForm({ reason: '' })
                              setRejectModal(true)
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Rejeter"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredReturns.length === 0 && (
          <div className="text-center py-12">
            <RotateCcw className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucun retour trouvé</p>
          </div>
        )}
      </div>

      {/* Modal Details */}
      {detailsModal && selectedReturn && (
        <Modal isOpen={detailsModal} onClose={() => setDetailsModal(false)} title={`Retour ${selectedReturn.returnNumber}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Commande</p>
                <p className="font-semibold">{selectedReturn.order?.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Magasin</p>
                <p className="font-semibold">{selectedReturn.order?.shop?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Raison</p>
                <p className="font-semibold">{getReasonLabel(selectedReturn.reason)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Montant</p>
                <p className="font-semibold text-red-600">{(selectedReturn.totalAmount || 0).toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Demandé le</p>
                <p className="font-semibold">
                  {new Date(selectedReturn.requestedAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                {getStatusBadge(selectedReturn.status)}
              </div>
            </div>

            {selectedReturn.description && (
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-700 bg-gray-50 rounded p-3 mt-1">{selectedReturn.description}</p>
              </div>
            )}

            {selectedReturn.items && selectedReturn.items.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Produits retournés</h3>
                <div className="space-y-2">
                  {selectedReturn.items.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.productName}</span>
                        <span className="font-semibold">{(item.totalPrice || 0).toFixed(2)} €</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.quantity} kg × {item.unitPrice.toFixed(2)} €/kg
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReturn.photoUrl && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Photo</p>
                <img 
                  src={selectedReturn.photoUrl} 
                  alt="Retour" 
                  className="max-w-full h-auto rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Approve */}
      {approveModal && selectedReturn && (
        <Modal isOpen={approveModal} onClose={() => setApproveModal(false)} title="Approuver le retour">
          <form onSubmit={handleApprove} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                Retour: <strong>{selectedReturn.returnNumber}</strong><br/>
                Montant: <strong>{selectedReturn.totalAmount.toFixed(2)} €</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de remboursement</label>
              <select
                value={approveForm.refundMethod}
                onChange={(e) => setApproveForm({ ...approveForm, refundMethod: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="CREDIT_NOTE">Avoir (Credit Note)</option>
                <option value="REFUND">Remboursement</option>
                <option value="REPLACEMENT">Remplacement produit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={approveForm.notes}
                onChange={(e) => setApproveForm({ ...approveForm, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setApproveModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Approuver
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Reject */}
      {rejectModal && selectedReturn && (
        <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Rejeter le retour">
          <form onSubmit={handleReject} className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">
                Vous êtes sur le point de rejeter le retour <strong>{selectedReturn.returnNumber}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Raison du rejet *</label>
              <textarea
                value={rejectForm.reason}
                onChange={(e) => setRejectForm({ ...rejectForm, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                required
                placeholder="Expliquez pourquoi ce retour est rejeté..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setRejectModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Rejeter
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default ReturnsManagement
