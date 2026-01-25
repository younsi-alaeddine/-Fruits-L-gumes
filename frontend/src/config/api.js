import axios from 'axios'

// Configuration de base pour toutes les requêtes API
// Utilise des chemins relatifs car Nginx fait le proxy vers localhost:5000
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
})

// Intercepteur pour ajouter le token JWT à chaque requête
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    const csrf = localStorage.getItem('csrfToken')
    if (csrf) config.headers['X-CSRF-Token'] = csrf
    const shopId = localStorage.getItem('selectedStoreId')
    if (shopId) {
      config.headers['X-Shop-Id'] = shopId
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    if (config.url === '/auth/profile' && config.method === 'put') {
      if (typeof config.data === 'string' && config.data.length === 36 && config.data.includes('-')) {
        return Promise.reject(new Error('Les données ne peuvent pas être un UUID. Veuillez envoyer un objet avec name et/ou phone.'))
      }
      if (typeof config.data !== 'object' || Array.isArray(config.data)) {
        return Promise.reject(new Error('Les données doivent être un objet'))
      }
    }
    return config
  },
  (e) => Promise.reject(e)
)

let refreshing = false
let refreshSubscribers = []
const subscribeTokenRefresh = (cb) => refreshSubscribers.push(cb)
const onRefreshed = (token) => { refreshSubscribers.forEach((cb) => cb(token)); refreshSubscribers = [] }

function handle401(config) {
  if (!refreshing) {
    refreshing = true
    return apiClient.post('/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const { accessToken, csrfToken } = res.data
        localStorage.setItem('token', accessToken)
        if (csrfToken) localStorage.setItem('csrfToken', csrfToken)
        onRefreshed(accessToken)
        config.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(config)
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('csrfToken')
        window.location.href = '/login'
        return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'))
      })
      .finally(() => { refreshing = false })
  }
  return new Promise((resolve) => {
    subscribeTokenRefresh((token) => {
      config.headers.Authorization = `Bearer ${token}`
      resolve(apiClient(config))
    })
  })
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erreurs HTTP (4xx, 5xx)
      const { status, data, config } = error.response
      if (status === 401 && config && !config.url?.startsWith('/auth/refresh') && !config.url?.startsWith('/auth/login')) {
        return handle401(config)
      }
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('csrfToken')
        window.location.href = '/login'
        return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'))
      }
      return Promise.reject(new Error(data?.message || data?.error || 'Une erreur est survenue'))
    } else if (error.request) {
      // Pas de réponse du serveur
      return Promise.reject(new Error('Impossible de contacter le serveur'))
    } else {
      // Erreur lors de la configuration de la requête
      return Promise.reject(new Error(error.message))
    }
  }
)

export { apiClient, API_BASE_URL }
export default apiClient
