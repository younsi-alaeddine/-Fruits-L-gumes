import apiClient from '../config/api'

export async function getCustomers(params = {}) {
  return { data: [] }
}

export async function getCustomer(id) {
  return null
}

export async function createCustomer(data) {
  return data
}

export async function updateCustomer(id, data) {
  return data
}

export async function deleteCustomer(id) {
  return { success: true }
}

export async function addLoyaltyPoints(id, points) {
  return { success: true }
}
