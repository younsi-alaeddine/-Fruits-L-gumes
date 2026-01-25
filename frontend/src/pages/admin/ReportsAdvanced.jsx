import React, { useState, useEffect } from 'react'
import {
  TrendingUp, Download, Calendar, DollarSign, ShoppingCart, Package,
  BarChart3, PieChart, Users, Store, ArrowUp, ArrowDown
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import {
  getSalesReport,
  getProductsReport,
  getCategoriesReport,
  getClientsReport,
  getTrendsReport,
  getPerformanceReport,
  exportSalesExcel
} from '../../api/reports'

function ReportsAdvanced() {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTab, setActiveTab] = useState('performance')
  
  // Données
  const [performance, setPerformance] = useState({})
  const [trends, setTrends] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [topClients, setTopClients] = useState([])

  useEffect(() => {
    loadData()
  }, [period, startDate, endDate])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      
      const [perfData, trendsData, productsData, categoriesData, clientsData] = await Promise.all([
        getPerformanceReport(params),
        getTrendsReport({ period }),
        getProductsReport(params),
        getCategoriesReport(params),
        getClientsReport(params)
      ])
      
      setPerformance(perfData.performance || {})
      setTrends(trendsData.trends || [])
      setTopProducts((productsData.products || []).slice(0, 10))
      setCategories(categoriesData.categories || [])
      setTopClients((clientsData.clients || []).slice(0, 10))
    } catch (error) {
      showError('Erreur lors du chargement des rapports')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      
      await exportSalesExcel(params)
      showSuccess('Export téléchargé')
    } catch (error) {
      showError('Erreur lors de l\'export')
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0)
  }

  if (loading && !performance.totalOrders) {
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-purple-600 bg-clip-text text-transparent">
            Rapports & Analytics
          </h1>
          <p className="text-gray-600 mt-2">Analyse détaillée des performances</p>
        </div>
        <button onClick={handleExportExcel} className="btn-primary">
          <Download className="h-5 w-5 mr-2" />
          Export Excel
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="year">12 derniers mois</option>
          </select>
          
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Date début"
          />
          
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Date fin"
          />
        </div>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
          <ShoppingCart className="h-10 w-10 text-blue-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Commandes</p>
          <p className="text-3xl font-bold text-gray-900">{performance.totalOrders || 0}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
          <DollarSign className="h-10 w-10 text-green-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">CA Total</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(performance.totalRevenue)}</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
          <TrendingUp className="h-10 w-10 text-purple-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Panier moyen</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(performance.averageOrderValue)}</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
          <DollarSign className="h-10 w-10 text-orange-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Commission</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(performance.totalCommission)}</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'performance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-5 w-5 inline mr-2" />
              Performance
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trends'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="h-5 w-5 inline mr-2" />
              Tendances
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-5 w-5 inline mr-2" />
              Produits
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PieChart className="h-5 w-5 inline mr-2" />
              Catégories
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-5 w-5 inline mr-2" />
              Clients
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Performance */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Produits actifs</p>
                  <p className="text-2xl font-bold text-gray-900">{performance.activeProducts || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Clients</p>
                  <p className="text-2xl font-bold text-gray-900">{performance.totalClients || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Magasins</p>
                  <p className="text-2xl font-bold text-gray-900">{performance.totalShops || 0}</p>
                </div>
              </div>

              {performance.ordersByStatus && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Répartition des commandes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-700">En attente</p>
                      <p className="text-2xl font-bold text-yellow-900">{performance.ordersByStatus.pending || 0}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-700">Validées</p>
                      <p className="text-2xl font-bold text-blue-900">{performance.ordersByStatus.validated || 0}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-700">Livrées</p>
                      <p className="text-2xl font-bold text-green-900">{performance.ordersByStatus.delivered || 0}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-700">Annulées</p>
                      <p className="text-2xl font-bold text-red-900">{performance.ordersByStatus.cancelled || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Tendances */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Évolution du CA</h3>
              <div className="space-y-2">
                {trends.map((trend, index) => {
                  const maxRevenue = Math.max(...trends.map(t => t.revenue))
                  const widthPercent = maxRevenue > 0 ? (trend.revenue / maxRevenue) * 100 : 0
                  
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-gray-600">
                        {new Date(trend.date).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-lg h-12 relative">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-lg flex items-center px-4"
                          style={{ width: `${widthPercent}%` }}
                        >
                          <span className="text-white font-semibold text-sm">
                            {formatCurrency(trend.revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="w-20 text-sm text-gray-600 text-right">
                        {trend.orderCount} cmd
                      </div>
                    </div>
                  )
                })}
              </div>
              {trends.length === 0 && (
                <p className="text-center text-gray-500 py-8">Aucune donnée disponible</p>
              )}
            </div>
          )}

          {/* Tab Produits */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Top 10 Produits</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantité</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CA TTC</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commandes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topProducts.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-semibold">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-900">{product.product?.name}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{product.product?.category}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{product.quantity.toFixed(2)} kg</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">
                          {formatCurrency(product.totalTTC)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{product.orderCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {topProducts.length === 0 && (
                <p className="text-center text-gray-500 py-8">Aucun produit vendu</p>
              )}
            </div>
          )}

          {/* Tab Catégories */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Ventes par catégorie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category, index) => {
                  const maxRevenue = Math.max(...categories.map(c => c.totalTTC))
                  const widthPercent = maxRevenue > 0 ? (category.totalTTC / maxRevenue) * 100 : 0
                  
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{category.category}</p>
                          <p className="text-sm text-gray-600">{category.productCount} produits</p>
                        </div>
                        <p className="font-bold text-green-600">{formatCurrency(category.totalTTC)}</p>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3 mt-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full"
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{category.quantity.toFixed(2)} kg vendus</p>
                    </div>
                  )
                })}
              </div>
              {categories.length === 0 && (
                <p className="text-center text-gray-500 py-8">Aucune catégorie</p>
              )}
            </div>
          )}

          {/* Tab Clients */}
          {activeTab === 'clients' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Top 10 Clients</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commandes</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Magasins</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CA TTC</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Panier moyen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topClients.map((client, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-semibold">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-900">{client.clientName}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{client.orderCount}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{client.shopsCount}</td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">
                          {formatCurrency(client.totalTTC)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(client.averageOrderValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {topClients.length === 0 && (
                <p className="text-center text-gray-500 py-8">Aucun client</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportsAdvanced
