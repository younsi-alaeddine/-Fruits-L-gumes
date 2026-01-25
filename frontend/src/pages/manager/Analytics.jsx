import React, { useState, useEffect } from 'react'
import { TrendingUp, Store, DollarSign } from 'lucide-react'
import { getSalesByCategory } from '../../api/analytics'

function ManagerAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { 
    loadData() 
  }, [])

  const loadData = async () => {
    try {
      const res = await getSalesByCategory()
      setData(res.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Analytics Manager</h1>
      
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.map((cat, idx) => (
            <div key={idx} className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{cat.category}</h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">+{cat.growth}%</span>
              </div>
              <p className="text-3xl font-bold text-primary-600 mb-2">{cat.revenue.toFixed(2)} €</p>
              <p className="text-sm text-gray-600">{cat.orders} commandes • Marge {cat.margin}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ManagerAnalytics
