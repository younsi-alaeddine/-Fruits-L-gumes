/**
 * API Stocks - Mock
 */

const mockStocks = [
  {
    id: 'stock-1',
    storeId: 'store-1',
    productId: 'product-1',
    quantity: 100,
    minStock: 20,
    maxStock: 200,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stock-2',
    storeId: 'store-1',
    productId: 'product-2',
    quantity: 50,
    minStock: 15,
    maxStock: 150,
    updatedAt: new Date().toISOString(),
  },
]

export async function getStocks(params = {}) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  let filtered = [...mockStocks]
  
  if (params.storeId) {
    filtered = filtered.filter((s) => s.storeId === params.storeId)
  }
  
  if (params.productId) {
    filtered = filtered.filter((s) => s.productId === params.productId)
  }
  
  return {
    data: filtered,
    total: filtered.length,
    totalPages: 1,
  }
}

export async function getStock(id) {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockStocks.find((s) => s.id === id)
}

export async function createStock(data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const newStock = {
    id: 'stock-' + Date.now(),
    ...data,
    updatedAt: new Date().toISOString(),
  }
  mockStocks.push(newStock)
  return newStock
}

export async function updateStock(id, data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockStocks.findIndex((s) => s.id === id)
  if (index !== -1) {
    mockStocks[index] = { ...mockStocks[index], ...data, updatedAt: new Date().toISOString() }
    return mockStocks[index]
  }
  throw new Error('Stock not found')
}

export async function decrementStock(storeId, productId, quantity) {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const stock = mockStocks.find((s) => s.storeId === storeId && s.productId === productId)
  if (stock) {
    stock.quantity = Math.max(0, stock.quantity - quantity)
    stock.updatedAt = new Date().toISOString()
    return stock
  }
  throw new Error('Stock not found')
}
