import React, { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users,
  Calendar, Filter, Download, BarChart3, PieChart, LineChart
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'
import {
  getTrendsReport,
  getPerformanceReport,
  getProductsReport,
  getCategoriesReport,
  getClientsReport
} from '../../api/reports'

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function Analytics() {
  const { toast, showToast, showSuccess, showError, hideToast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30') // 7, 30, 90, 365
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Données
  const [trends, setTrends] = useState(null)
  const [performance, setPerformance] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [topCategories, setTopCategories] = useState([])
  const [topClients, setTopClients] = useState([])

  useEffect(() => {
    loadData()
  }, [period, startDate, endDate])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const params = {}
      if (period === 'custom' && startDate && endDate) {
        params.startDate = startDate
        params.endDate = endDate
      } else {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - parseInt(period))
        params.startDate = start.toISOString().split('T')[0]
        params.endDate = end.toISOString().split('T')[0]
      }
      
      const [trendsData, performanceData, productsData, categoriesData, clientsData] = await Promise.all([
        getTrendsReport(params),
        getPerformanceReport(params),
        getProductsReport({ ...params, limit: 10 }),
        getCategoriesReport(params),
        getClientsReport({ ...params, limit: 10 })
      ])
      
      setTrends(trendsData)
      setPerformance(performanceData)
      setTopProducts(productsData.products || [])
      setTopCategories(categoriesData.categories || [])
      setTopClients(clientsData.clients || [])
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Configuration des graphiques
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString('fr-FR') + ' €'
          }
        }
      }
    }
  }

  // Graphique revenus (Line)
  const revenueChartData = trends ? {
    labels: trends.daily?.map(d => new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })) || [],
    datasets: [
      {
        label: 'Revenus (€)',
        data: trends.daily?.map(d => d.revenue || 0) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Commandes',
        data: trends.daily?.map(d => d.orders || 0) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  } : null

  const revenueChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        ...chartOptions.scales.y,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return value
          }
        }
      }
    }
  }

  // Graphique catégories (Doughnut)
  const categoriesChartData = topCategories.length > 0 ? {
    labels: topCategories.map(c => c.name || c.categoryName),
    datasets: [
      {
        data: topCategories.map(c => c.revenue || c.totalRevenue || 0),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(14, 165, 233, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  } : null

  // Graphique produits (Bar)
  const productsChartData = topProducts.length > 0 ? {
    labels: topProducts.map(p => p.name || p.productName).slice(0, 10),
    datasets: [
      {
        label: 'Quantité vendue',
        data: topProducts.map(p => p.quantity || p.totalQuantity || 0).slice(0, 10),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      },
      {
        label: 'Revenus (€)',
        data: topProducts.map(p => p.revenue || p.totalRevenue || 0).slice(0, 10),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        yAxisID: 'y1'
      }
    ]
  } : null

  const productsChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        ...chartOptions.scales.y,
        position: 'left',
        ticks: {
          callback: function(value) {
            return value
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString('fr-FR') + ' €'
          }
        }
      }
    }
  }

  if (loading && !trends) {
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
            Analytics Avancé
          </h1>
          <p className="text-gray-600 mt-2">Graphiques, tendances et analyses détaillées</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => { setPeriod('7'); setStartDate(''); setEndDate('') }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === '7' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => { setPeriod('30'); setStartDate(''); setEndDate('') }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === '30' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              30 jours
            </button>
            <button
              onClick={() => { setPeriod('90'); setStartDate(''); setEndDate('') }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === '90' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              90 jours
            </button>
          </div>
          
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setPeriod('custom')
            }}
            placeholder="Date début"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setPeriod('custom')
            }}
            placeholder="Date fin"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
          >
            <Filter className="h-5 w-5" />
            Appliquer
          </button>
        </div>
      </div>

      {/* KPIs */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              {performance.revenueGrowth >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className="text-sm text-gray-600 font-medium">Revenus totaux</p>
            <p className="text-3xl font-bold text-gray-900">
              {(performance.totalRevenue || 0).toLocaleString('fr-FR')} €
            </p>
            <p className={`text-sm mt-2 ${performance.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {performance.revenueGrowth >= 0 ? '+' : ''}{performance.revenueGrowth?.toFixed(1) || 0}%
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              {performance.ordersGrowth >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className="text-sm text-gray-600 font-medium">Commandes</p>
            <p className="text-3xl font-bold text-gray-900">{performance.totalOrders || 0}</p>
            <p className={`text-sm mt-2 ${performance.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {performance.ordersGrowth >= 0 ? '+' : ''}{performance.ordersGrowth?.toFixed(1) || 0}%
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Panier moyen</p>
            <p className="text-3xl font-bold text-gray-900">
              {(performance.averageBasket || 0).toFixed(2)} €
            </p>
            <p className="text-sm mt-2 text-gray-600">
              {performance.totalOrders || 0} commandes
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Clients actifs</p>
            <p className="text-3xl font-bold text-gray-900">{performance.activeClients || 0}</p>
            <p className="text-sm mt-2 text-gray-600">
              {performance.newClients || 0} nouveaux
            </p>
          </div>
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenus et Commandes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <LineChart className="h-6 w-6 text-blue-600" />
              Évolution Revenus & Commandes
            </h3>
          </div>
          <div className="h-80">
            {revenueChartData && (
              <Line data={revenueChartData} options={revenueChartOptions} />
            )}
          </div>
        </div>

        {/* Catégories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="h-6 w-6 text-green-600" />
              Répartition par Catégories
            </h3>
          </div>
          <div className="h-80">
            {categoriesChartData && (
              <Doughnut data={categoriesChartData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Top Produits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-orange-600" />
            Top 10 Produits
          </h3>
        </div>
        <div className="h-80">
          {productsChartData && (
            <Bar data={productsChartData} options={productsChartOptions} />
          )}
        </div>
      </div>

      {/* Tableaux détaillés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Catégories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Top Catégories</h3>
          <div className="space-y-3">
            {topCategories.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{cat.name || cat.categoryName}</p>
                    <p className="text-sm text-gray-500">{cat.quantity || cat.totalQuantity || 0} unités</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">
                  {(cat.revenue || cat.totalRevenue || 0).toLocaleString('fr-FR')} €
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Top Clients</h3>
          <div className="space-y-3">
            {topClients.slice(0, 5).map((client, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{client.name || client.shopName}</p>
                    <p className="text-sm text-gray-500">{client.orders || client.totalOrders || 0} commandes</p>
                  </div>
                </div>
                <p className="font-bold text-blue-600">
                  {(client.revenue || client.totalRevenue || 0).toLocaleString('fr-FR')} €
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
