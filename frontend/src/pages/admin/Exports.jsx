import React, { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Calendar } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import { exportSalesExcel } from '../../api/reports'
import { exportSuppliersCSV } from '../../api/suppliers'
import { exportOrders, exportProducts, exportOrdersExcel } from '../../api/exports'

function AdminExports() {
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()
  const [loading, setLoading] = useState({ orders: false, products: false, sales: false, suppliers: false })

  const handleExportOrders = async () => {
    try {
      setLoading(prev => ({ ...prev, orders: true }))
      await exportOrders()
      showSuccess('Export des commandes téléchargé avec succès')
    } catch (error) {
      showError('Erreur lors de l\'export des commandes')
      console.error(error)
    } finally {
      setLoading(prev => ({ ...prev, orders: false }))
    }
  }

  const handleExportProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }))
      await exportProducts()
      showSuccess('Export des produits téléchargé avec succès')
    } catch (error) {
      showError('Erreur lors de l\'export des produits')
      console.error(error)
    } finally {
      setLoading(prev => ({ ...prev, products: false }))
    }
  }

  const handleExportSales = async () => {
    try {
      setLoading(true)
      await exportSalesExcel({ period: 'month' })
      showToast('Export des ventes téléchargé avec succès', 'success')
    } catch (error) {
      showError('Erreur lors de l\'export des ventes')
    } finally {
      setLoading(false)
    }
  }

  const handleExportSuppliers = async () => {
    try {
      setLoading(true)
      await exportSuppliersCSV()
      showToast('Export des fournisseurs téléchargé avec succès', 'success')
    } catch (error) {
      showError('Erreur lors de l\'export des fournisseurs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          Exports de données
        </h1>
        <p className="text-gray-600">Téléchargez vos données au format Excel ou CSV</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Export Commandes */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Commandes</h3>
                <p className="text-sm text-gray-500">Format CSV/Excel</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportOrders}
            disabled={loading}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>

        {/* Export Produits */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Produits</h3>
                <p className="text-sm text-gray-500">Format CSV/Excel</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportProducts}
            disabled={loading.products}
            className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading.products ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Export...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </>
            )}
          </button>
        </div>

        {/* Export Ventes */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileSpreadsheet className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Ventes</h3>
                <p className="text-sm text-gray-500">Format Excel</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportSales}
            disabled={loading}
            className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
        </div>

        {/* Export Fournisseurs */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Fournisseurs</h3>
                <p className="text-sm text-gray-500">Format CSV</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportSuppliers}
            disabled={loading.suppliers}
            className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading.suppliers ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Export...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminExports
