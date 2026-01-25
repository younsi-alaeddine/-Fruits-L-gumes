import React, { useState, useEffect } from 'react'
import { 
  FileText, Download, Mail, CheckCircle, Clock, AlertCircle, Eye, 
  Plus, Filter, TrendingUp, Calendar, Euro, Send, CreditCard, RefreshCw,
  FileDown, X, Check
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import Modal from '../../components/common/Modal'
import {
  getInvoices,
  getInvoice,
  getInvoiceStats,
  getInvoicePayments,
  recordPayment,
  createCreditNote,
  sendReminder,
  downloadInvoicePDF,
  sendInvoiceEmail,
  exportAccounting
} from '../../api/invoices'

function Invoices() {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast()
  
  const [invoices, setInvoices] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Modals
  const [detailsModal, setDetailsModal] = useState(false)
  const [paymentModal, setPaymentModal] = useState(false)
  const [creditNoteModal, setCreditNoteModal] = useState(false)
  
  // Données sélectionnées
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [invoicePayments, setInvoicePayments] = useState([])
  const [activeTab, setActiveTab] = useState('info')
  
  // Formulaires
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'TRANSFER',
    reference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  
  const [creditNoteForm, setCreditNoteForm] = useState({
    amount: '',
    reason: '',
    notes: ''
  })

  useEffect(() => {
    loadInvoices()
    loadStats()
  }, [statusFilter, startDate, endDate])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) loadInvoices()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (searchTerm) params.search = searchTerm

      const data = await getInvoices(params)
      setInvoices(data.invoices || [])
    } catch (error) {
      showError('Erreur lors du chargement des factures')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      
      const data = await getInvoiceStats(params)
      setStats(data.stats || {})
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  const handleViewDetails = async (invoice) => {
    try {
      const data = await getInvoice(invoice.id)
      setSelectedInvoice(data.invoice || invoice)
      
      const paymentsData = await getInvoicePayments(invoice.id)
      setInvoicePayments(paymentsData.payments || [])
      
      setDetailsModal(true)
      setActiveTab('info')
    } catch (error) {
      showError('Erreur lors du chargement des détails')
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    try {
      await recordPayment(selectedInvoice.id, {
        ...paymentForm,
        amount: parseFloat(paymentForm.amount)
      })
      
      showSuccess('Paiement enregistré avec succès')
      setPaymentModal(false)
      setPaymentForm({ amount: '', method: 'TRANSFER', reference: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' })
      loadInvoices()
      loadStats()
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement')
    }
  }

  const handleCreateCreditNote = async (e) => {
    e.preventDefault()
    try {
      await createCreditNote(selectedInvoice.id, {
        ...creditNoteForm,
        amount: parseFloat(creditNoteForm.amount)
      })
      
      showSuccess('Avoir créé avec succès')
      setCreditNoteModal(false)
      setCreditNoteForm({ amount: '', reason: '', notes: '' })
      loadInvoices()
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de la création de l\'avoir')
    }
  }

  const handleSendReminder = async (invoice) => {
    try {
      await sendReminder(invoice.id)
      showSuccess('Relance envoyée avec succès')
      loadInvoices()
    } catch (error) {
      showError('Erreur lors de l\'envoi de la relance')
    }
  }

  const handleDownloadPDF = async (invoice) => {
    try {
      await downloadInvoicePDF(invoice.id)
      showSuccess('Téléchargement en cours...')
    } catch (error) {
      showError('Erreur lors du téléchargement')
    }
  }

  const handleSendEmail = async (invoice) => {
    try {
      await sendInvoiceEmail(invoice.id)
      showSuccess('Facture envoyée par email')
      loadInvoices()
    } catch (error) {
      showError('Erreur lors de l\'envoi de l\'email')
    }
  }

  const handleExportAccounting = async () => {
    try {
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      
      await exportAccounting(params)
      showSuccess('Export téléchargé')
    } catch (error) {
      showError('Erreur lors de l\'export')
    }
  }

  const getStatusBadge = (status) => {
    const configs = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Brouillon' },
      SENT: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Envoyée' },
      PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'Payée' },
      PARTIAL: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Partielle' },
      OVERDUE: { bg: 'bg-red-100', text: 'text-red-700', label: 'En retard' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Annulée' }
    }
    const config = configs[status] || configs.DRAFT
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>{config.label}</span>
  }

  const getPaymentMethodLabel = (method) => {
    const labels = {
      CASH: 'Espèces',
      CHECK: 'Chèque',
      CARD: 'Carte',
      TRANSFER: 'Virement',
      DIRECT_DEBIT: 'Prélèvement',
      OTHER: 'Autre'
    }
    return labels[method] || method
  }

  if (loading && invoices.length === 0) {
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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
          Facturation
        </h1>
        <button
          onClick={handleExportAccounting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FileDown className="h-5 w-5" />
          Export Comptable
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
          <FileText className="h-10 w-10 text-blue-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Total Factures</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total || 0}</p>
          <p className="text-sm text-blue-600 mt-1">{(stats.revenue?.total || 0).toFixed(2)} €</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
          <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Payées</p>
          <p className="text-3xl font-bold text-gray-900">{stats.paid || 0}</p>
          <p className="text-sm text-green-600 mt-1">{(stats.revenue?.paid || 0).toFixed(2)} €</p>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6">
          <Clock className="h-10 w-10 text-yellow-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">En attente</p>
          <p className="text-3xl font-bold text-gray-900">{stats.sent || 0}</p>
          <p className="text-sm text-yellow-600 mt-1">{(stats.revenue?.remaining || 0).toFixed(2)} €</p>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">En retard</p>
          <p className="text-3xl font-bold text-gray-900">{stats.overdue || 0}</p>
          <p className="text-sm text-red-600 mt-1">À échéance : {stats.upcomingDue || 0}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="DRAFT">Brouillon</option>
            <option value="SENT">Envoyée</option>
            <option value="PAID">Payée</option>
            <option value="PARTIAL">Partielle</option>
            <option value="OVERDUE">En retard</option>
          </select>
          
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Facture</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant TTC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reste</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Échéance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{invoice.order?.shop?.name || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-gray-900">{(invoice.totalTTC || 0).toFixed(2)} €</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-green-600 font-semibold">{(invoice.paidAmount || 0).toFixed(2)} €</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-orange-600 font-semibold">{(invoice.remainingAmount || 0).toFixed(2)} €</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(invoice)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(invoice)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Télécharger PDF"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleSendEmail(invoice)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Envoyer par email"
                      >
                        <Mail className="h-5 w-5" />
                      </button>
                      {(invoice.status === 'SENT' || invoice.status === 'PARTIAL' || invoice.status === 'OVERDUE') && (
                        <button
                          onClick={() => handleSendReminder(invoice)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Envoyer relance"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {invoices.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune facture trouvée</p>
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {detailsModal && selectedInvoice && (
        <Modal isOpen={detailsModal} onClose={() => setDetailsModal(false)} title={`Facture ${selectedInvoice.invoiceNumber}`}>
          <div className="space-y-6">
            {/* Onglets */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'info'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Informations
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'payments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Paiements ({invoicePayments.length})
                </button>
              </nav>
            </div>

            {/* Contenu onglets */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="font-semibold">{selectedInvoice.order?.shop?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total HT</p>
                    <p className="font-semibold">{(selectedInvoice.totalHT || 0).toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">TVA</p>
                    <p className="font-semibold">{(selectedInvoice.totalTVA || 0).toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total TTC</p>
                    <p className="font-semibold text-lg">{(selectedInvoice.totalTTC || 0).toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Montant payé</p>
                    <p className="font-semibold text-green-600">{(selectedInvoice.paidAmount || 0).toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Restant dû</p>
                    <p className="font-semibold text-orange-600">{(selectedInvoice.remainingAmount || 0).toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date échéance</p>
                    <p className="font-semibold">
                      {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  {selectedInvoice.remainingAmount > 0 && (
                    <>
                      <button
                        onClick={() => {
                          setPaymentModal(true)
                          setPaymentForm({
                            ...paymentForm,
                            amount: selectedInvoice.remainingAmount.toFixed(2)
                          })
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <CreditCard className="h-5 w-5" />
                        Enregistrer paiement
                      </button>
                      <button
                        onClick={() => setCreditNoteModal(true)}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="h-5 w-5" />
                        Créer avoir
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4">
                {invoicePayments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun paiement enregistré</p>
                ) : (
                  <div className="space-y-3">
                    {invoicePayments.map((payment) => (
                      <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-lg">{payment.amount.toFixed(2)} €</p>
                            <p className="text-sm text-gray-600">
                              {getPaymentMethodLabel(payment.paymentMethod)}
                              {payment.reference && ` • ${payment.reference}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Reçu
                          </span>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-gray-600 mt-2">{payment.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Paiement */}
      {paymentModal && (
        <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title="Enregistrer un paiement">
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant</label>
              <input
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de paiement</label>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="TRANSFER">Virement</option>
                <option value="CHECK">Chèque</option>
                <option value="CARD">Carte bancaire</option>
                <option value="CASH">Espèces</option>
                <option value="DIRECT_DEBIT">Prélèvement</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Référence</label>
              <input
                type="text"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="N° chèque, transaction..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de paiement</label>
              <input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Avoir */}
      {creditNoteModal && (
        <Modal isOpen={creditNoteModal} onClose={() => setCreditNoteModal(false)} title="Créer un avoir">
          <form onSubmit={handleCreateCreditNote} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Montant</label>
              <input
                type="number"
                step="0.01"
                value={creditNoteForm.amount}
                onChange={(e) => setCreditNoteForm({ ...creditNoteForm, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Raison</label>
              <input
                type="text"
                value={creditNoteForm.reason}
                onChange={(e) => setCreditNoteForm({ ...creditNoteForm, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Produit défectueux, erreur de facturation..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={creditNoteForm.notes}
                onChange={(e) => setCreditNoteForm({ ...creditNoteForm, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCreditNoteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Créer l'avoir
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Invoices
