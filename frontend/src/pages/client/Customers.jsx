import React, { useState, useEffect } from 'react'
import { Users, Plus, Eye, Edit2, Gift, Search } from 'lucide-react'
import { getCustomers } from '../../api/customers'

function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({ total: 0, totalSpent: 0, avgOrders: 0 })

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    try {
      const res = await getCustomers(1)
      const customersData = res.data || []
      setCustomers(customersData)
      setStats({
        total: customersData.length,
        totalSpent: customersData.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
        avgOrders: customersData.length > 0 ? Math.round(customersData.reduce((sum, c) => sum + (c.totalOrders || 0), 0) / customersData.length) : 0,
      })
    } catch (error) {
      console.error(error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = (customers || []).filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Clients Finaux</h1>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Nouveau Client</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <Users className="h-10 w-10 text-blue-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Total Clients</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <Gift className="h-10 w-10 text-green-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">CA Total</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalSpent.toFixed(2)} €</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <Users className="h-10 w-10 text-purple-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Moy. Commandes</p>
          <p className="text-3xl font-bold text-gray-900">{stats.avgOrders}</p>
        </div>
      </div>

      <div className="card">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input type="text" placeholder="Rechercher un client..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10 w-full" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commandes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CA Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points Fidélité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière Visite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-primary-600">{customer.totalOrders}</td>
                  <td className="px-6 py-4 text-lg font-bold text-gray-900">{customer.totalSpent.toFixed(2)} €</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">{customer.loyaltyPoints} pts</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{customer.lastVisit}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="h-5 w-5" /></button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Edit2 className="h-5 w-5" /></button>
                      <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"><Gift className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Customers
