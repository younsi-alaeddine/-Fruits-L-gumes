import React, { useState, useEffect } from 'react'
import { Target, Plus, TrendingUp, Award } from 'lucide-react'
import { getGoals, createGoal } from '../../api/goals'

function Goals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadGoals() }, [])

  const loadGoals = async () => {
    try {
      const res = await getGoals()
      setGoals(res.data || [])
    } catch (error) {
      console.error(error)
      setGoals([])
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = (progress) => {
    if (progress >= 90) return 'bg-green-500'
    if (progress >= 70) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Objectifs</h1>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Nouvel Objectif</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">{goal.storeName}</h3>
              {goal.progress >= 100 && <Award className="h-6 w-6 text-yellow-500" />}
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Objectif : {goal.target.toLocaleString()} €</span>
                  <span className="font-bold text-primary-600">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className={`h-full ${getProgressColor(goal.progress)} transition-all`} style={{ width: `${Math.min(goal.progress, 100)}%` }}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{goal.current.toLocaleString()} €</p>
                  <p className="text-xs text-gray-500">Réalisé</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">{(goal.target - goal.current).toLocaleString()} €</p>
                  <p className="text-xs text-gray-500">Restant</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-center">
                <Target className="h-4 w-4 mr-1" />
                Échéance : {goal.deadline}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Goals
