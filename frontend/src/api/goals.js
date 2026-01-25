import apiClient from '../config/api'

export async function getGoals(params = {}) {
  return { data: [] }
}

export async function createGoal(data) {
  return data
}

export async function updateGoal(id, data) {
  return data
}

export async function deleteGoal(id) {
  return { success: true }
}
