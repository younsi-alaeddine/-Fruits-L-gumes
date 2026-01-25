import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setUser(null);
        return null;
      }

      // S'assurer que le token est dans les headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const response = await api.get('/auth/me');
      
      if (response.data && response.data.user) {
        // Synchroniser le magasin actif côté client
        const serverActiveShopId = response.data.user.shop?.id;
        if (serverActiveShopId) {
          localStorage.setItem('activeShopId', serverActiveShopId);
        } else {
          localStorage.removeItem('activeShopId');
        }
        setUser(response.data.user);
        setLoading(false);
        return response.data.user;
      } else {
        // Réponse invalide, nettoyer et permettre l'accès à la page de login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setLoading(false);
        return null;
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      
      // Pour toutes les erreurs (401, réseau, timeout, etc.), nettoyer et permettre l'accès
      // L'intercepteur axios gérera le refresh si nécessaire, mais ici on s'assure que loading devient false
      if (error.response?.status === 401) {
        // Token invalide ou expiré
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setLoading(false);
        return null;
      }
      
      // Pour les erreurs réseau ou autres erreurs, permettre quand même l'accès à l'app
      // L'utilisateur pourra essayer de se connecter
      setUser(null);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au chargement
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // S'assurer que le token est dans les headers axios
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          await fetchUser();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        // En cas d'erreur, permettre quand même l'accès à l'application
        setLoading(false);
        setUser(null);
      }
    };

    // Timeout de sécurité pour éviter un chargement infini
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Timeout lors de l\'initialisation de l\'authentification');
        setLoading(false);
      }
    }, 10000); // 10 secondes maximum

    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password }, {
        timeout: 10000
      });
      const { accessToken, refreshToken, token, user } = response.data;
      
      // Gérer les nouveaux tokens (accessToken/refreshToken) ou l'ancien format (token)
      const authToken = accessToken || token;
      
      if (!authToken) {
        throw new Error('Token non reçu du serveur');
      }
      
      // Toujours stocker le token
      localStorage.setItem('token', authToken);
      
      // Stocker le refresh token s'il existe (devrait toujours exister avec le nouveau système)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('Refresh token stocké avec succès');
      } else {
        console.warn('Aucun refresh token reçu du serveur');
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      if (user?.shop?.id) {
        localStorage.setItem('activeShopId', user.shop.id);
      } else {
        localStorage.removeItem('activeShopId');
      }
      setUser(user);
      setLoading(false);
      return { success: true, user };
    } catch (error) {
      setLoading(false);
      console.error('Erreur login détaillée:', error);
      
      // Gestion des erreurs réseau
      if (error.message && (error.message.includes('Network Error') || error.message.includes('se connecter au serveur'))) {
        return {
          success: false,
          message: 'Impossible de se connecter au serveur backend. Vérifiez votre connexion internet.'
        };
      }
      
      // Gestion du timeout
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          success: false,
          message: 'La requête a pris trop de temps. Vérifiez votre connexion internet.'
        };
      }

      // Gestion de l'email non vérifié
      if (error.response?.status === 403 && error.response?.data?.requiresEmailVerification) {
        return {
          success: false,
          requiresEmailVerification: true,
          message: error.response.data.message || 'Votre adresse email n\'a pas été vérifiée',
          email: error.response.data.email
        };
      }
      
      // Gestion spécifique de l'erreur 429 (Too Many Requests)
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfter || 900; // 15 minutes par défaut
        const minutes = Math.ceil(retryAfter / 60);
        return {
          success: false,
          message: `Trop de tentatives de connexion. Veuillez réessayer dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
          isRateLimited: true,
          retryAfter,
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur de connexion'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      // Inscription: le backend demande une vérification email avant login
      if (response.data?.requiresEmailVerification) {
        return { success: true, requiresEmailVerification: true, user: response.data.user };
      }
      // Compat legacy si jamais token est encore retourné
      const { token, user } = response.data;
      if (token) {
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
      }
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur d\'inscription',
        errors: error.response?.data?.errors
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('activeShopId');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setLoading(false);
  };

  const setActiveShopId = async (shopId) => {
    if (!shopId) {
      localStorage.removeItem('activeShopId');
      await fetchUser();
      return;
    }
    localStorage.setItem('activeShopId', shopId);
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser, setActiveShopId }}>
      {children}
    </AuthContext.Provider>
  );
};

