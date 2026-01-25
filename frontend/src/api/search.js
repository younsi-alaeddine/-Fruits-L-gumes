import apiClient from '../config/api'

/**
 * Recherche globale (produits, commandes, users, magasins) – ADMIN
 * GET /api/search?q=...
 */
export async function globalSearch(query) {
  try {
    const response = await apiClient.get('/search', { params: { q: query } })
    return response.data
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 403) {
      return {
        success: true,
        results: {
          products: [],
          clients: [],
          orders: [],
          users: [],
          stores: [],
        },
      }
    }
    throw error
  }
}
