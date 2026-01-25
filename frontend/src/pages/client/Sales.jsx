import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Package, Calendar } from 'lucide-react'
import { getSales, getSalesStats } from '../../api/sales'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'

function StoreSales() {
  const { user } = useAuth()
  const { selectedStoreId } = useStore()
  const [sales, setSales] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')

  useEffect(() => {
    if (selectedStoreId) loadSales()
  }, [selectedStoreId, dateStart, dateEnd])

  const loadSales = async () => {
    try {
      setLoading(true)
      const filters = { storeId: selectedStoreId }
      if (dateStart) filters.dateStart = dateStart
      if (dateEnd) filters.dateEnd = dateEnd
      
      const [salesRes, statsRes] = await Promise.all([getSales(filters), getSalesStats(filters)])
      setSales(salesRes?.orders ?? [])
      setStats(statsRes?.data ?? statsRes ?? null)
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
        Mes Ventes
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

      {/* Filtres date */}
      <div className="card">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date début</label>
            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date fin</label>
            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-full" />
          </div>
        </div>
      </div>

      {/* Table ventes */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">N°</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Client</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Achat</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Vente</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Marge</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sales.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{s.saleNumber}</td>
                <td className="px-4 py-3 text-sm">{s.date} {s.time}</td>
                <td className="px-4 py-3 text-sm">{s.customerName}</td>
                <td className="px-4 py-3 text-sm text-right">{s.totalPurchase.toFixed(2)} €</td>
                <td className="px-4 py-3 text-sm text-right font-semibold">{s.totalSelling.toFixed(2)} €</td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    +{s.totalMargin.toFixed(2)} €
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StoreSales
