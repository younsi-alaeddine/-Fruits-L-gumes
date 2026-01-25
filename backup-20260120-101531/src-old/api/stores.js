/**
 * API Stores - Mock
 */

const mockStores = [
  {
    id: 'store-1',
    name: 'Entrepôt Paris Nord',
    code: 'PARIS-NORD-001',
    address: {
      street: '123 Rue de Paris',
      city: 'Paris',
      zipCode: '75001',
      country: 'France',
    },
    phone: '+33 1 23 45 67 89',
    email: 'paris-nord@example.com',
    clientId: 'client-1',
    managerId: 'user-3',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'store-2',
    name: 'Dépôt Lyon Sud',
    code: 'LYON-SUD-001',
    address: {
      street: '456 Avenue de Lyon',
      city: 'Lyon',
      zipCode: '69001',
      country: 'France',
    },
    phone: '+33 4 12 34 56 78',
    email: 'lyon-sud@example.com',
    clientId: 'client-1',
    managerId: null,
    createdAt: new Date().toISOString(),
  },
]

export async function getStores(params = {}) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  let filtered = [...mockStores]
  
  if (params.storeId) {
    filtered = filtered.filter((s) => s.id === params.storeId)
  }
  
  if (params.clientId) {
    filtered = filtered.filter((s) => s.clientId === params.clientId)
  }
  
  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (s) => s.name.toLowerCase().includes(search) || s.code.toLowerCase().includes(search)
    )
  }
  
  return {
    data: filtered,
    total: filtered.length,
    totalPages: 1,
  }
}

export async function getStore(id) {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockStores.find((s) => s.id === id)
}

export async function createStore(data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const newStore = {
    id: 'store-' + Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
  }
  mockStores.push(newStore)
  return newStore
}

export async function updateStore(id, data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockStores.findIndex((s) => s.id === id)
  if (index !== -1) {
    mockStores[index] = { ...mockStores[index], ...data, updatedAt: new Date().toISOString() }
    return mockStores[index]
  }
  throw new Error('Store not found')
}

export async function deleteStore(id) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockStores.findIndex((s) => s.id === id)
  if (index !== -1) {
    mockStores.splice(index, 1)
    return { success: true }
  }
  throw new Error('Store not found')
}
