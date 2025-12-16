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

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au chargement
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // S'assurer que le token est dans les headers axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await fetchUser();
      } else {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

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
        setUser(response.data.user);
        setLoading(false);
        return response.data.user;
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      
      // Ne pas supprimer le token immédiatement - laisser l'intercepteur gérer
      // L'intercepteur axios tentera de rafraîchir le token automatiquement
      if (error.response?.status === 401) {
        // Si c'est une erreur 401, l'intercepteur va essayer de rafraîchir
        // Ne pas supprimer le token ici, laisser l'intercepteur gérer
        setUser(null);
        setLoading(false);
        // Ne pas rediriger ici, l'intercepteur s'en occupe
        return null;
      }
      
      // Pour les autres erreurs (réseau, etc.), ne pas déconnecter
      setLoading(false);
      return null;
    }
  };

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
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true };
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
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

