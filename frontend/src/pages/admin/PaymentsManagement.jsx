import React, { useState, useEffect } from 'react'
import {
  CreditCard, DollarSign, Calendar, AlertTriangle, CheckCircle,
  XCircle, Eye, Download, Search, Filter, TrendingUp, Clock
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import Modal from '../../components/common/Modal'
import {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  downloadReceipt,
  getPaymentStats,
  getPaymentSchedule,
  getOverduePayments,
  markAsPaid
} from '../../api/payments'

function PaymentsManagement() {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast()
  
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState({})
  const [schedule, setSchedule] = useState([])
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // all, schedule, overdue
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Modals
  const [detailsModal, setDetailsModal] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  
  // Données sélectionnées
  const [selectedPayment, setSelectedPayment] = useState(null)
  
  // Formulaires
  const [paymentForm, setPaymentForm] = useState({
    orderId: '',
    amount: '',
    paymentMethod: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'EN_ATTENTE',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [activeTab, statusFilter, startDate, endDate])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      
      if (activeTab === 'all') {
        const [paymentsData, statsData] = await Promise.all([
          getPayments(params),
          getPaymentStats(params)
        ])
        setPayments(paymentsData.payments || [])
        setStats(statsData.stats || {})
      } else if (activeTab === 'schedule') {
        const scheduleData = await getPaymentSchedule(30)
        setSchedule(scheduleData.schedule || [])
      } else if (activeTab === 'overdue') {
        const overdueData = await getOverduePayments()
        setOverdue(overdueData.overdue || [])
      }
    } catch (error) {
      showError('Erreur lors du chargement')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (payment) => {
    try {
      const data = await getPayment(payment.id)
      setSelectedPayment(data.payment || payment)
      setDetailsModal(true)
    } catch (error) {
      showError('Erreur lors du chargement des détails')
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      await createPayment(paymentForm)
      showSuccess('Paiement créé avec succès')
      setAddModal(false)
      setPaymentForm({
        orderId: '',
        amount: '',
        paymentMethod: 'CASH',
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'EN_ATTENTE',
        notes: ''
      })
      loadData()
    } catch (error) {
      showError('Erreur lors de la création')
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      await updatePayment(selectedPayment.id, paymentForm)
      showSuccess('Paiement modifié avec succès')
      setEditModal(false)
      setSelectedPayment(null)
      loadData()
    } catch (error) {
      showError('Erreur lors de la modification')
    }
  }

  const handleDelete = async () => {
    try {
      await deletePayment(selectedPayment.id)
      showSuccess('Paiement supprimé')
      setDeleteModal(false)
      setSelectedPayment(null)
      loadData()
    } catch (error) {
      showError('Erreur lors de la suppression')
    }
  }

  const handleDownloadReceipt = async (payment) => {
    try {
      await downloadReceipt(payment.id)
      showSuccess('Reçu téléchargé')
    } catch (error) {
      showError('Erreur lors du téléchargement')
    }
  }

  const handleMarkAsPaid = async (payment) => {
    try {
      await markAsPaid(payment.id)
      showSuccess('Paiement marqué comme payé')
      loadData()
    } catch (error) {
      showError('Erreur')
    }
  }

  const getStatusBadge = (status) => {
    const configs = {
      PAYE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Payé', icon: CheckCircle },
      EN_ATTENTE: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente', icon: Clock },
      IMPAYE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Impayé', icon: XCircle },
      REMBOURSE: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Remboursé', icon: CheckCircle }
    }
    const config = configs[status] || configs.EN_ATTENTE
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  const getMethodLabel = (method) => {
    const labels = {
      CASH: 'Espèces',
      CARD: 'Carte',
      TRANSFER: 'Virement',
      CHECK: 'Chèque',
      OTHER: 'Autre'
    }
    return labels[method] || method
  }

  const filteredPayments = (payments || []).filter(p => {
    const orderNumber = p.order?.orderNumber || ''
    const shopName = p.order?.shop?.name || ''
    const receiptNumber = p.receiptNumber || ''
    
    return (
      orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (loading && payments.length === 0 && schedule.length === 0 && overdue.length === 0) {
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-900 to-green-600 bg-clip-text text-transparent">
            Gestion des Paiements
          </h1>
          <p className="text-gray-600 mt-2">Paiements, échéanciers et recouvrement</p>
        </div>
        <button
          onClick={() => {
            setPaymentForm({
              orderId: '',
              amount: '',
              paymentMethod: 'CASH',
              paymentDate: new Date().toISOString().split('T')[0],
              status: 'EN_ATTENTE',
              notes: ''
            })
            setAddModal(true)
          }}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2"
        >
          <CreditCard className="h-5 w-5" />
          Nouveau paiement
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'all' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Tous les paiements
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'schedule' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Échéancier
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
              activeTab === 'overdue' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Recouvrement
            {overdue.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {overdue.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats (only for 'all' tab) */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
            <DollarSign className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-gray-900">{(stats.totalAmount || 0).toFixed(2)} €</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Payés</p>
            <p className="text-2xl font-bold text-gray-900">{stats.paid || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-4">
            <Clock className="h-8 w-8 text-yellow-500 mb-2" />
            <p className="text-sm text-gray-600 font-medium">En attente</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending || 0}</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-gray-600 font-medium">Impayés</p>
            <p className="text-2xl font-bold text-gray-900">{stats.unpaid || 0}</p>
          </div>
        </div>
      )}

      {/* Filtres (only for 'all' tab) */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="PAYE">Payés</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="IMPAYE">Impayés</option>
            </select>
            
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Date début"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Date fin"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      )}

      {/* Table All Payments */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Reçu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commande</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Méthode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{payment.receiptNumber || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{payment.order?.orderNumber || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{payment.order?.shop?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-green-600">{(payment.amount || 0).toFixed(2)} €</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{getMethodLabel(payment.paymentMethod)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('fr-FR') : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Voir détails"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadReceipt(payment)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Télécharger reçu"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        {payment.status === 'EN_ATTENTE' && (
                          <button
                            onClick={() => handleMarkAsPaid(payment)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Marquer payé"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun paiement trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Échéance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schedule.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm">{item.reference}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{item.client}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{(item.amount || 0).toFixed(2)} €</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString('fr-FR') : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${item.daysOverdue > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {item.daysOverdue > 0 ? `+${item.daysOverdue}j` : `${item.daysOverdue}j`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleMarkAsPaid({ id: item.id })}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Marquer payé
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {schedule.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun paiement à l'échéance</p>
            </div>
          )}
        </div>
      )}

      {/* Overdue Tab */}
      {activeTab === 'overdue' && (
        <div className="space-y-4">
          {overdue.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-red-900 font-medium">Total en retard</p>
                  <p className="text-3xl font-bold text-red-600">
                    {overdue.reduce((sum, item) => sum + item.remaining, 0).toFixed(2)} €
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-red-900 font-medium">Nombre de dossiers</p>
                  <p className="text-3xl font-bold text-red-600">{overdue.length}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payé</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reste</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Échéance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retard</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {overdue.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-mono text-sm font-semibold">{item.reference}</span>
                          {item.invoiceNumber && (
                            <p className="text-xs text-gray-500">Facture: {item.invoiceNumber}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">{item.client.name}</p>
                          <p className="text-xs text-gray-500">{item.client.city}</p>
                          {item.client.phone && (
                            <p className="text-xs text-gray-500">{item.client.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">{(item.amount || 0).toFixed(2)} €</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-green-600">{(item.paid || 0).toFixed(2)} €</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-red-600">{(item.remaining || 0).toFixed(2)} €</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">
                          {item.dueDate ? new Date(item.dueDate).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                          {item.daysOverdue} jours
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedPayment({ id: item.id, orderId: item.id })
                            setPaymentForm({
                              orderId: item.id,
                              amount: item.remaining,
                              paymentMethod: 'CASH',
                              paymentDate: new Date().toISOString().split('T')[0],
                              status: 'PAYE',
                              notes: `Recouvrement - ${item.daysOverdue} jours de retard`
                            })
                            setAddModal(true)
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                        >
                          Enregistrer paiement
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {overdue.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun paiement en retard</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Details */}
      {detailsModal && selectedPayment && (
        <Modal isOpen={detailsModal} onClose={() => setDetailsModal(false)} title="Détails du paiement">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">N° Reçu</p>
                <p className="font-semibold">{selectedPayment.receiptNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Montant</p>
                <p className="font-semibold text-green-600">{(selectedPayment.amount || 0).toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Méthode</p>
                <p className="font-semibold">{getMethodLabel(selectedPayment.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                {getStatusBadge(selectedPayment.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold">
                  {selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleString('fr-FR') : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Commande</p>
                <p className="font-semibold">{selectedPayment.order?.orderNumber || '-'}</p>
              </div>
            </div>
            
            {selectedPayment.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-gray-700 bg-gray-50 rounded p-3 mt-1">{selectedPayment.notes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => handleDownloadReceipt(selectedPayment)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Télécharger reçu PDF
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Add/Edit */}
      {(addModal || editModal) && (
        <Modal
          isOpen={addModal || editModal}
          onClose={() => {
            setAddModal(false)
            setEditModal(false)
            setSelectedPayment(null)
          }}
          title={addModal ? 'Nouveau paiement' : 'Modifier paiement'}
        >
          <form onSubmit={addModal ? handleAdd : handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID Commande *</label>
              <input
                type="text"
                value={paymentForm.orderId}
                onChange={(e) => setPaymentForm({ ...paymentForm, orderId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Méthode</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="CASH">Espèces</option>
                  <option value="CARD">Carte</option>
                  <option value="TRANSFER">Virement</option>
                  <option value="CHECK">Chèque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={paymentForm.status}
                  onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="PAYE">Payé</option>
                  <option value="IMPAYE">Impayé</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                rows="3"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setAddModal(false)
                  setEditModal(false)
                  setSelectedPayment(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                {addModal ? 'Créer' : 'Modifier'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default PaymentsManagement
