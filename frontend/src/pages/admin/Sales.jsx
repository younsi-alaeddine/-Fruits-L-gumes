import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Package, Download, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { getSales } from '../../api/sales'
import { useToast } from '../../hooks/useToast'
import Toast from '../../components/common/Toast'

function AdminSales() {
  const { toast, showToast, hideToast, showError } = useToast()
  const [sales, setSales] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  useEffect(() => {
    loadSales()
  }, [dateStart, dateEnd])

  const loadSales = async () => {
    try {
      setLoading(true)
      const filters = { limit: 2000 }
      if (dateStart) filters.startDate = dateStart
      if (dateEnd) filters.endDate = dateEnd
      const salesRes = await getSales(filters)
      const orderList = salesRes?.orders ?? []
      setSales(orderList)
      const totalRevenue = orderList.reduce((s, o) => s + (o.totalTTC ?? 0), 0)
      const totalMargin = orderList.reduce((s, o) => s + (o.totalMargin ?? (o.totalTTC ?? 0) - (o.totalHT ?? 0)), 0)
      setStats({
        totalRevenue,
        totalMargin,
        totalSales: orderList.length,
        averageMarginPercent: totalRevenue ? Math.round((totalMargin / totalRevenue) * 100) : 0,
      })
    } catch (error) {
      showError('Erreur lors du chargement des ventes')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div></div>

  return (
    <div className="space-y-6">
      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          Ventes ADMIN
        </h1>
        <p className="text-gray-600">Historique ventes propres Fattah</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">CA Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalRevenue.toFixed(2)} €</p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-500 opacity-60" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Marge Totale</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMargin.toFixed(2)} €</p>
              </div>
              <TrendingUp className="h-12 w-12 text-green-500 opacity-60" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Nb Ventes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSales}</p>
              </div>
              <Package className="h-12 w-12 text-purple-500 opacity-60" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Marge %</p>
                <p className="text-3xl font-bold text-gray-900">{stats.averageMarginPercent}%</p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-500 opacity-60" />
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date début</label>
            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date fin</label>
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-full" />
          </div>
          <button className="btn-primary mt-7 px-6 py-3"><Download className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Liste ventes */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">N° Vente</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Magasin</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Prix achat</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Prix vente</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Marge</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sales.map((order) => {
              const ttc = order.totalTTC ?? 0
              const ht = order.totalHT ?? 0
              const m = order.totalMargin ?? (ttc - ht)
              const pct = ttc ? Math.round((m / ttc) * 100) : (order.totalMarginPercent ?? 0)
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber || order.id?.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.createdAt ? `${format(new Date(order.createdAt), 'dd/MM/yyyy')} ${format(new Date(order.createdAt), 'HH:mm')}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{order.shop?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{order.shop?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{ht.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{ttc.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                      +{m.toFixed(2)} € ({pct}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="p-2 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminSales
