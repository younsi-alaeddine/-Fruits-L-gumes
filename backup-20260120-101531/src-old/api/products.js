/**
 * API Products - Mock
 */

const mockProducts = [
  {
    id: 'product-1',
    name: 'Pommes Golden',
    sku: 'FRUIT-POMME-001',
    description: 'Pommes Golden délicieuses',
    category: 'Fruits',
    subCategory: 'Pommes',
    unit: 'kg',
    priceHT: 2.5,
    tva: 5.5,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'product-2',
    name: 'Tomates',
    sku: 'LEG-TOM-001',
    description: 'Tomates fraîches',
    category: 'Légumes',
    subCategory: 'Tomates',
    unit: 'kg',
    priceHT: 3.0,
    tva: 5.5,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

export async function getProducts(params = {}) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  let filtered = [...mockProducts]
  
  if (params.category) {
    filtered = filtered.filter((p) => p.category === params.category)
  }
  
  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.sku?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
    )
  }
  
  return {
    data: filtered,
    total: filtered.length,
    totalPages: 1,
  }
}

export async function getProduct(id) {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockProducts.find((p) => p.id === id)
}

export async function createProduct(data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const newProduct = {
    id: 'product-' + Date.now(),
    ...data,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: new Date().toISOString(),
  }
  mockProducts.push(newProduct)
  return newProduct
}

export async function updateProduct(id, data) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockProducts.findIndex((p) => p.id === id)
  if (index !== -1) {
    mockProducts[index] = { ...mockProducts[index], ...data, updatedAt: new Date().toISOString() }
    return mockProducts[index]
  }
  throw new Error('Product not found')
}

export async function deleteProduct(id) {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockProducts.findIndex((p) => p.id === id)
  if (index !== -1) {
    mockProducts.splice(index, 1)
    return { success: true }
  }
  throw new Error('Product not found')
}
