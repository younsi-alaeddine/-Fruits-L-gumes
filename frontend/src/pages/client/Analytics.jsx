import React, { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Package } from 'lucide-react'
import { getGlobalKPI } from '../../api/analytics'

function StoreAnalytics() {
  const [kpi, setKpi] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { 
    loadData() 
  }, [])

  const loadData = async () => {
    try {
      const res = await getGlobalKPI()
      setKpi(res.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Analytics Magasin</h1>
      
      {kpi && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <DollarSign className="h-10 w-10 text-blue-500 mb-3" />
            <p className="text-sm text-gray-600 font-medium">CA</p>
            <p className="text-3xl font-bold text-gray-900">{kpi.totalRevenue.toFixed(2)} €</p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <Package className="h-10 w-10 text-green-500 mb-3" />
            <p className="text-sm text-gray-600 font-medium">Commandes</p>
            <p className="text-3xl font-bold text-gray-900">{kpi.totalOrders}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <TrendingUp className="h-10 w-10 text-purple-500 mb-3" />
            <p className="text-sm text-gray-600 font-medium">Croissance</p>
            <p className="text-3xl font-bold text-gray-900">+{kpi.revenueGrowth}%</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default StoreAnalytics
