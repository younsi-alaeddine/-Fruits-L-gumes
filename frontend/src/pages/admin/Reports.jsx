import React, { useState, useEffect } from 'react'
import { TrendingUp, Download, Calendar, DollarSign, ShoppingCart, Store, Package, BarChart3 } from 'lucide-react'
import { getOrdersReport, getMarginsReport, getStoresReport } from '../../api/reports'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'

function AdminReports() {
  const { toast, showToast, hideToast, showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [ordersReport, setOrdersReport] = useState(null)
  const [marginsReport, setMarginsReport] = useState(null)
  const [storesReport, setStoresReport] = useState(null)
  const [period, setPeriod] = useState('week')

  useEffect(() => { loadReports() }, [period])

  const periodToRange = (p) => {
    const end = new Date()
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    if (p === 'day') {
      // already today
    } else if (p === 'week') {
      start.setDate(start.getDate() - 7)
    } else if (p === 'month') {
      start.setMonth(start.getMonth() - 1)
    } else if (p === 'year') {
      start.setFullYear(start.getFullYear() - 1)
    }
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }
  }

  const loadReports = async () => {
    try {
      setLoading(true)
      const { startDate, endDate } = periodToRange(period)
      const params = { startDate, endDate }
      const [salesRes, perfRes, clientsRes] = await Promise.all([
        getOrdersReport(params),
        getMarginsReport(params),
        getStoresReport(params)
      ])
      const stats = salesRes?.stats ?? {}
      const orderList = salesRes?.orders ?? []
      const byDate = {}
      orderList.forEach((o) => {
        const d = new Date(o.createdAt).toISOString().split('T')[0]
        if (!byDate[d]) byDate[d] = { date: d, orders: 0, amount: 0 }
        byDate[d].orders++
        byDate[d].amount += o.totalTTC ?? 0
      })
      const timeline = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)).slice(-7)
      const byShop = {}
      orderList.forEach((o) => {
        const s = o.shop
        const id = s?.id ?? 'unknown'
        if (!byShop[id]) byShop[id] = { id, name: s?.name ?? 'Inconnu', orders: 0, amount: 0, commission: 0 }
        byShop[id].orders++
        byShop[id].amount += o.totalTTC ?? 0
        byShop[id].commission += o.totalMargin ?? 0
      })
      const topStores = Object.values(byShop).sort((a, b) => b.amount - a.amount).slice(0, 5)
      const totalOrders = stats.totalOrders ?? orderList.length
      const totalAmount = stats.totalTTC ?? orderList.reduce((s, o) => s + (o.totalTTC ?? 0), 0)
      const perf = perfRes?.performance ?? {}
      setOrdersReport({
        summary: {
          growthRate: 0,
          totalOrders,
          totalAmount,
          totalCommission: perf.totalCommission ?? orderList.filter((o) => o.status === 'LIVREE').reduce((s, o) => s + (o.totalMargin ?? 0), 0),
          averageOrderValue: totalOrders ? totalAmount / totalOrders : 0,
        },
        timeline,
        topStores,
        byStatus: Object.entries(stats.ordersByStatus ?? {}).map(([status, count]) => ({
          status,
          count,
          amount: 0,
        })),
      })
      setMarginsReport({
        commissionPercent: totalAmount ? Math.round(((perf.totalCommission ?? 0) / totalAmount) * 100) : 0,
        topProfitable: [],
      })
      setStoresReport(clientsRes?.clients ?? [])
    } catch (error) {
      showError('Erreur chargement rapports')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div></div>

  const maxOrders = Math.max(1, ...(ordersReport?.timeline || []).map((t) => t.orders))

  return (
    <div className="space-y-6">
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            Rapports & Statistiques
          </h1>
          <p className="text-gray-600">Vue d'ensemble des performances</p>
        </div>
        <div className="flex items-center space-x-3">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-4 py-2 border-2 border-gray-200 rounded-lg">
            <option value="day">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          <button className="btn-primary flex items-center space-x-2 px-4 py-2">
            <Download className="h-5 w-5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {ordersReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <ShoppingCart className="h-10 w-10 text-blue-500" />
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                +{ordersReport.summary.growthRate}%
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Total Commandes</p>
            <p className="text-3xl font-bold text-gray-900">{ordersReport.summary.totalOrders}</p>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="h-10 w-10 text-green-500" />
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 font-medium">CA Total</p>
            <p className="text-3xl font-bold text-gray-900">{ordersReport.summary.totalAmount.toFixed(2)} €</p>
          </div>

          <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="h-10 w-10 text-orange-500" />
              <span className="text-xs font-bold text-orange-600">{marginsReport?.commissionPercent}%</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Commission Totale</p>
            <p className="text-3xl font-bold text-gray-900">{ordersReport.summary.totalCommission.toFixed(2)} €</p>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <ShoppingCart className="h-10 w-10 text-purple-500" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Panier Moyen</p>
            <p className="text-3xl font-bold text-gray-900">{ordersReport.summary.averageOrderValue.toFixed(2)} €</p>
          </div>
        </div>
      )}

      {/* Graphique Timeline */}
      {ordersReport?.timeline && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-primary-600" />
            Évolution Commandes (7 derniers jours)
          </h2>
          <div className="space-y-4">
            {ordersReport.timeline.map((day, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">{day.orders} commandes</span>
                    <span className="font-bold text-gray-900">{day.amount.toFixed(2)} €</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all"
                    style={{ width: `${(day.orders / maxOrders) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Magasins */}
        {ordersReport?.topStores && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Store className="h-6 w-6 mr-2 text-primary-600" />
              Top Magasins
            </h2>
            <div className="space-y-3">
              {ordersReport.topStores.map((store, idx) => (
                <div key={store.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{store.name}</p>
                    <p className="text-sm text-gray-600">{store.orders} commandes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{store.amount.toFixed(2)} €</p>
                    <p className="text-sm text-green-600">+{store.commission.toFixed(2)} €</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Produits Rentables */}
        {marginsReport?.topProfitable && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Package className="h-6 w-6 mr-2 text-primary-600" />
              Top Produits Rentables
            </h2>
            <div className="space-y-3">
              {marginsReport.topProfitable.map((product, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    <p className="font-bold text-green-600">+{product.margin.toFixed(2)} €</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                      style={{ width: `${product.marginPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Marge: {product.marginPercent}%</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats par statut */}
      {ordersReport?.byStatus && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Répartition par Statut</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {ordersReport.byStatus.map(status => (
              <div key={status.status} className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-2xl font-bold text-gray-900">{status.count}</p>
                <p className="text-sm text-gray-600 capitalize">{status.status}</p>
                <p className="text-xs text-gray-500 mt-1">{status.amount.toFixed(2)} €</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReports
