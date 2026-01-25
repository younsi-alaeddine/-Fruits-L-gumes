/**
 * API Orders - Mock
 */

const mockOrders = [
  {
    id: 'order-1',
    orderNumber: 'CMD-2024-001',
    clientId: 'client-1',
    storeId: 'store-1',
    status: 'confirmée',
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    items: [
      { productId: 'product-1', quantity: 10, unit: 'kg', price: 2.5 },
      { productId: 'product-2', quantity: 5, unit: 'kg', price: 3.0 },
    ],
    total: 40.0,
    totalTTC: 42.2,
    createdAt: new Date().toISOString(),
  },
]

export async function getOrders(params = {}) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  let filtered = [...mockOrders]
  
  if (params.status) {
    filtered = filtered.filter((o) => o.status === params.status)
  }
  
  if (params.clientId) {
    filtered = filtered.filter((o) => o.clientId === params.clientId)
  }
  
  if (params.storeId) {
    filtered = filtered.filter((o) => o.storeId === params.storeId)
  }
  
  return {
    data: filtered,
    total: filtered.length,
    totalPages: 1,
  }
}

export async function getOrder(id) {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockOrders.find((o) => o.id === id)
}

export async function createOrder(data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const newOrder = {
    id: 'order-' + Date.now(),
    orderNumber: 'CMD-' + new Date().getFullYear() + '-' + String(mockOrders.length + 1).padStart(3, '0'),
    ...data,
    status: data.status || 'brouillon',
    total: data.items?.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0) || 0,
    totalTTC: 0, // Calculé côté serveur
    createdAt: new Date().toISOString(),
  }
  mockOrders.push(newOrder)
  return newOrder
}

export async function updateOrder(id, data, storeId) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockOrders.findIndex((o) => o.id === id)
  if (index !== -1) {
    mockOrders[index] = { ...mockOrders[index], ...data, updatedAt: new Date().toISOString() }
    return mockOrders[index]
  }
  throw new Error('Order not found')
}

export async function deleteOrder(id) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockOrders.findIndex((o) => o.id === id)
  if (index !== -1) {
    mockOrders.splice(index, 1)
    return { success: true }
  }
  throw new Error('Order not found')
}
