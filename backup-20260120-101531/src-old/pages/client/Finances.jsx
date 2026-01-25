import React, { useState, useEffect, useMemo } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Calendar, Filter, Download } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import DataTable from '../../components/common/DataTable'
import Toast from '../../components/common/Toast'
import { useToast } from '../../hooks/useToast'
import { getOrders } from '../../api/orders'
import { getStores } from '../../api/stores'

/**
 * Page de finances - CLIENT
 * Vue consolidée des finances de tous les magasins
 */
function ClientFinances() {
  const { toast, showToast, hideToast, showSuccess, showError } = useToast()

  const [orders, setOrders] = useState([])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month') // month, quarter, year, custom
  const [selectedStoreId, setSelectedStoreId] = useState(null)
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadOrders()
  }, [dateRange, selectedStoreId, startDate, endDate])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadStores(), loadOrders()])
    } catch (error) {
      showError('Erreur lors du chargement des données')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadStores = async () => {
    try {
      const response = await getStores()
      setStores(response.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const loadOrders = async () => {
    try {
      const params = {
        storeId: selectedStoreId || undefined,
        status: 'livrée', // Seulement les commandes livrées
      }
      const response = await getOrders(params)
      let filteredOrders = response.data || []

      // Filtrer par date
      const now = new Date()
      let filterStart, filterEnd

      switch (dateRange) {
        case 'month':
          filterStart = startOfMonth(now)
          filterEnd = endOfMonth(now)
          break
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3)
          filterStart = new Date(now.getFullYear(), quarter * 3, 1)
          filterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
          break
        case 'year':
          filterStart = new Date(now.getFullYear(), 0, 1)
          filterEnd = new Date(now.getFullYear(), 11, 31)
          break
        case 'custom':
          filterStart = new Date(startDate)
          filterEnd = new Date(endDate)
          break
        default:
          filterStart = startOfMonth(now)
          filterEnd = endOfMonth(now)
      }

      filteredOrders = filteredOrders.filter((order) => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= filterStart && orderDate <= filterEnd
      })

      setOrders(filteredOrders)
    } catch (error) {
      showError('Erreur lors du chargement des commandes')
      console.error(error)
    }
  }

  // Statistiques consolidées
  const stats = useMemo(() => {
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalTTC || o.total || 0), 0)
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Statistiques par magasin
    const byStore = stores.reduce((acc, store) => {
      const storeOrders = orders.filter((o) => o.storeId === store.id)
      const storeRevenue = storeOrders.reduce((sum, o) => sum + (o.totalTTC || o.total || 0), 0)
      
      acc[store.id] = {
        name: store.name,
        orders: storeOrders.length,
        revenue: storeRevenue,
        averageOrder: storeOrders.length > 0 ? storeRevenue / storeOrders.length : 0,
      }
      return acc
    }, {})

    // Évolution (comparaison avec la période précédente)
    const previousPeriod = orders.filter((o) => {
      const orderDate = new Date(o.createdAt)
      const now = new Date()
      const previousMonth = subMonths(now, 1)
      return orderDate >= startOfMonth(previousMonth) && orderDate <= endOfMonth(previousMonth)
    })
    const previousRevenue = previousPeriod.reduce((sum, o) => sum + (o.totalTTC || o.total || 0), 0)
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    return {
      totalOrders,
      totalRevenue,
      averageOrder,
      byStore,
      revenueChange,
      previousRevenue,
    }
  }, [orders, stores])

  const columns = [
    {
      key: 'orderNumber',
      label: 'N° Commande',
      render: (value, order) => (
        <div>
          <p className="font-semibold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">
            {format(new Date(order.createdAt), 'dd MMM yyyy')}
          </p>
        </div>
      ),
    },
    {
      key: 'storeId',
      label: 'Magasin',
      render: (value) => {
        const store = stores.find((s) => s.id === value)
        return <span className="text-sm text-gray-600">{store?.name || value}</span>
      },
    },
    {
      key: 'totalTTC',
      label: 'Montant TTC',
      render: (value, order) => (
        <p className="font-bold text-gray-900">
          {(order.totalTTC || order.total || 0).toFixed(2)} €
        </p>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {format(new Date(value), 'dd MMM yyyy')}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finances</h1>
          <p className="text-gray-600">Vue consolidée des finances de tous vos magasins</p>
        </div>
        <button className="btn btn-secondary flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Exporter</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input pl-10"
            >
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
              <option value="custom">Période personnalisée</option>
            </select>
          </div>
          {dateRange === 'custom' && (
            <>
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                />
              </div>
            </>
          )}
          <div>
            <select
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value || null)}
              className="input"
            >
              <option value="">Tous les magasins</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalRevenue.toFixed(2)} €
              </p>
              {stats.revenueChange !== 0 && (
                <div className={`flex items-center mt-2 text-sm font-semibold ${
                  stats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.revenueChange > 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  <span>{Math.abs(stats.revenueChange).toFixed(1)}%</span>
                  <span className="ml-2 text-gray-500 font-normal">vs période précédente</span>
                </div>
              )}
            </div>
            <DollarSign className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total commandes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Panier moyen</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageOrder.toFixed(2)} €
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Période précédente</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.previousRevenue.toFixed(2)} €
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Performance par magasin */}
      {stores.length > 1 && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Performance par magasin</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store) => {
              const storeStats = stats.byStore[store.id] || {
                name: store.name,
                orders: 0,
                revenue: 0,
                averageOrder: 0,
              }
              return (
                <div
                  key={store.id}
                  className="p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-all"
                >
                  <h4 className="font-bold text-gray-900 mb-3">{storeStats.name}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Commandes</span>
                      <span className="font-bold text-gray-900">{storeStats.orders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Chiffre d'affaires</span>
                      <span className="font-bold text-gray-900">
                        {storeStats.revenue.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Panier moyen</span>
                      <span className="font-bold text-gray-900">
                        {storeStats.averageOrder.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Détail des commandes */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Détail des commandes</h3>
        <DataTable
          data={orders}
          columns={columns}
          currentPage={1}
          totalPages={1}
          total={orders.length}
          onPageChange={() => {}}
          loading={loading}
          emptyMessage="Aucune commande trouvée"
        />
      </div>

      {/* Toast */}
      <Toast {...toast} onClose={hideToast} />
    </div>
  )
}

export default ClientFinances
