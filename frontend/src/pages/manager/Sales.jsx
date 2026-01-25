import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Package } from 'lucide-react'
import { format } from 'date-fns'
import { getSales } from '../../api/sales'
import { getManagerShops } from '../../api/stores'

function ManagerSales() {
  const [sales, setSales] = useState([])
  const [stats, setStats] = useState(null)
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedStore])

  const loadData = async () => {
    try {
      setLoading(true)
      const storesRes = await getManagerShops({ page: 1, limit: 200 })
      setStores(storesRes?.shops ?? [])
      const filters = { limit: 2000 }
      if (selectedStore !== 'all') filters.storeId = selectedStore
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
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
        Ventes Magasins
      </h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <p className="text-sm text-gray-600 font-medium">CA Total</p>
            <p className="text-3xl font-bold">{stats.totalRevenue.toFixed(2)} €</p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <p className="text-sm text-gray-600 font-medium">Marge</p>
            <p className="text-3xl font-bold">{stats.totalMargin.toFixed(2)} €</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <p className="text-sm text-gray-600 font-medium">Ventes</p>
            <p className="text-3xl font-bold">{stats.totalSales}</p>
          </div>
          <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
            <p className="text-sm text-gray-600 font-medium">Marge %</p>
            <p className="text-3xl font-bold">{stats.averageMarginPercent}%</p>
          </div>
        </div>
      )}

      {/* Filtre magasin */}
      <div className="card">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Magasin</label>
        <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="w-full">
          <option value="all">Tous mes magasins</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Table ventes */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">N° Vente</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Magasin</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Prix achat</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Prix vente</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Marge</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sales.map((o) => {
              const ttc = o.totalTTC ?? 0
              const ht = o.totalHT ?? 0
              const m = o.totalMargin ?? (ttc - ht)
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{o.orderNumber || o.id?.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm">
                    {o.createdAt ? `${format(new Date(o.createdAt), 'dd/MM/yyyy')} ${format(new Date(o.createdAt), 'HH:mm')}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">{o.shop?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-right">{ht.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">{ttc.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      +{m.toFixed(2)} €
                    </span>
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

export default ManagerSales
