/**
 * API Users - Mock
 */

const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+33 1 23 45 67 89',
    role: 'ADMIN',
    clientId: null,
    storeId: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    email: 'client@example.com',
    firstName: 'Client',
    lastName: 'User',
    phone: '+33 1 23 45 67 90',
    role: 'CLIENT',
    clientId: 'client-1',
    storeId: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-3',
    email: 'manager@example.com',
    firstName: 'Manager',
    lastName: 'User',
    phone: '+33 1 23 45 67 91',
    role: 'MANAGER',
    clientId: null,
    storeId: 'store-1',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

export async function getUsers(params = {}) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  let filtered = [...mockUsers]
  
  if (params.role) {
    filtered = filtered.filter((u) => u.role === params.role)
  }
  
  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (u) =>
        u.email.toLowerCase().includes(search) ||
        u.firstName.toLowerCase().includes(search) ||
        u.lastName.toLowerCase().includes(search)
    )
  }
  
  return {
    data: filtered,
    total: filtered.length,
    totalPages: 1,
  }
}

export async function getUser(id) {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockUsers.find((u) => u.id === id)
}

export async function createUser(data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const newUser = {
    id: 'user-' + Date.now(),
    ...data,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: new Date().toISOString(),
  }
  mockUsers.push(newUser)
  return newUser
}

export async function updateUser(id, data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockUsers.findIndex((u) => u.id === id)
  if (index !== -1) {
    mockUsers[index] = { ...mockUsers[index], ...data, updatedAt: new Date().toISOString() }
    return mockUsers[index]
  }
  throw new Error('User not found')
}

export async function deleteUser(id) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockUsers.findIndex((u) => u.id === id)
  if (index !== -1) {
    mockUsers.splice(index, 1)
    return { success: true }
  }
  throw new Error('User not found')
}

export async function activateUser(id) {
  return updateUser(id, { isActive: true })
}

export async function deactivateUser(id) {
  return updateUser(id, { isActive: false })
}

export async function updateUserProfile(id, data) {
  return updateUser(id, data)
}

export async function changeUserPassword(id, currentPassword, newPassword) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  // TODO: Implémenter la vérification du mot de passe actuel et le changement
  // Pour l'instant, on simule juste le succès
  return { success: true, message: 'Mot de passe modifié avec succès' }
}
