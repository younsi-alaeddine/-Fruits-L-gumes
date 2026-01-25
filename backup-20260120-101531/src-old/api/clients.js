/**
 * API Clients - Mock
 */

const mockClients = [
  {
    id: 'client-1',
    companyName: 'Fruits & Légumes SA',
    siret: '12345678901234',
    address: {
      street: '123 Rue de Paris',
      city: 'Paris',
      zipCode: '75001',
      country: 'France',
    },
    contactEmail: 'contact@fruits-legumes.fr',
    contactPhone: '+33 1 23 45 67 89',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

export async function getClients(params = {}) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  let filtered = [...mockClients]
  
  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        c.companyName.toLowerCase().includes(search) ||
        c.siret.includes(search) ||
        c.contactEmail.toLowerCase().includes(search)
    )
  }
  
  return {
    data: filtered,
    total: filtered.length,
    totalPages: 1,
  }
}

export async function getClient(id) {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockClients.find((c) => c.id === id)
}

export async function createClient(data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const newClient = {
    id: 'client-' + Date.now(),
    ...data,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  mockClients.push(newClient)
  return newClient
}

export async function updateClient(id, data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockClients.findIndex((c) => c.id === id)
  if (index !== -1) {
    mockClients[index] = { ...mockClients[index], ...data, updatedAt: new Date().toISOString() }
    return mockClients[index]
  }
  throw new Error('Client not found')
}

export async function deleteClient(id) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockClients.findIndex((c) => c.id === id)
  if (index !== -1) {
    mockClients.splice(index, 1)
    return { success: true }
  }
  throw new Error('Client not found')
}
