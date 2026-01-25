import axios from 'axios';

// Helper pour obtenir l'URL de base de l'API
export const getApiBaseURL = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  if (apiUrl) {
    // Si REACT_APP_API_URL contient déjà /api, on l'utilise tel quel
    // Sinon, on ajoute /api
    return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;
  }
  return '/api';
};

// Helper pour obtenir l'URL de base du serveur (sans /api) pour les images
export const getServerBaseURL = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  if (apiUrl) {
    // Retirer /api si présent
    return apiUrl.replace(/\/api\/?$/, '');
  }
  return 'https://fatah-commander.cloud';
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000, // Timeout de 30 secondes (augmenté pour Render)
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const activeShopId = localStorage.getItem('activeShopId');
    if (activeShopId) {
      config.headers['X-Shop-Id'] = activeShopId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs et rafraîchir le token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si erreur 401 et ce n'est pas une requête de refresh ou de login
    if (error.response?.status === 401 && !originalRequest._retry) {
      const requestUrl = originalRequest.url || '';
      
      // Éviter les boucles infinies - ne pas rafraîchir pour login/refresh
      if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh')) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Si on est déjà en train de rafraîchir, mettre en queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // Pas de refresh token disponible
        isRefreshing = false;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Ne rediriger que si on n'est pas déjà sur une page publique
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Essayer de rafraîchir le token
        const response = await axios.post(
          `${getApiBaseURL()}/auth/refresh`,
          { refreshToken },
          {
            // Ne pas utiliser l'intercepteur pour cette requête
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        if (accessToken) {
          console.log('Token rafraîchi avec succès');
          localStorage.setItem('token', accessToken);
          // Mettre à jour le refresh token s'il est fourni
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
            console.log('Nouveau refresh token stocké');
          }
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          processQueue(null, accessToken);
          isRefreshing = false;
          
          return api(originalRequest);
        } else {
          throw new Error('Access token non reçu');
        }
      } catch (refreshError) {
        // Le refresh a échoué, déconnecter l'utilisateur
        console.error('Erreur lors du rafraîchissement:', refreshError.response?.data || refreshError.message);
        processQueue(refreshError, null);
        isRefreshing = false;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Ne rediriger que si on n'est pas déjà sur la page de login
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Gestion des erreurs réseau
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout: La requête a pris trop de temps');
      return Promise.reject(new Error('La requête a pris trop de temps. Vérifiez votre connexion.'));
    }
    
    if (error.message === 'Network Error' || !error.response) {
      console.error('Erreur réseau:', error.message);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      return Promise.reject(new Error(`Impossible de se connecter au serveur backend. URL: ${apiUrl}`));
    }

    return Promise.reject(error);
  }
);

export default api;

