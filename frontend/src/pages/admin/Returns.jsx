import React, { useState, useEffect } from 'react'
import { RotateCcw, CheckCircle, XCircle, Eye } from 'lucide-react'
import { getReturns, approveReturn, rejectReturn } from '../../api/returns'

function Returns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 })

  useEffect(() => { loadReturns() }, [])

  const loadReturns = async () => {
    try {
      const res = await getReturns()
      const returnsData = res.data || []
      setReturns(returnsData)
      setStats({
        pending: returnsData.filter(r => r.status === 'pending').length,
        approved: returnsData.filter(r => r.status === 'approved').length,
        rejected: returnsData.filter(r => r.status === 'rejected').length,
      })
    } catch (error) {
      console.error(error)
      setReturns([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    }
    const labels = { pending: 'En attente', approved: 'Approuvé', rejected: 'Rejeté' }
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Gestion des Retours</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200">
          <RotateCcw className="h-10 w-10 text-yellow-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">En attente</p>
          <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Approuvés</p>
          <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
          <XCircle className="h-10 w-10 text-red-500 mb-3" />
          <p className="text-sm text-gray-600 font-medium">Rejetés</p>
          <p className="text-3xl font-bold text-gray-900">{stats.rejected}</p>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Commande</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Magasin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raison</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {returns.map((ret) => (
                <tr key={ret.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm font-semibold">{ret.orderNumber}</td>
                  <td className="px-6 py-4 text-gray-900">{ret.storeName}</td>
                  <td className="px-6 py-4 font-medium">{ret.productName}</td>
                  <td className="px-6 py-4 text-center font-bold">{ret.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ret.reason}</td>
                  <td className="px-6 py-4">{getStatusBadge(ret.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ret.createdAt}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="h-5 w-5" /></button>
                      {ret.status === 'pending' && (
                        <>
                          <button onClick={() => approveReturn(ret.id, 'refund')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5" /></button>
                          <button onClick={() => rejectReturn(ret.id, 'Non justifié')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><XCircle className="h-5 w-5" /></button>
                        </>
                      )}
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

export default Returns
