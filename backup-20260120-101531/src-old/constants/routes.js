/**
 * Définition des routes de l'application
 */

export const ROUTES = {
  // Routes publiques
  LOGIN: '/login',
  HOME: '/',

  // Routes ADMIN
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    CLIENTS: '/admin/clients',
    STORES: '/admin/stores',
    USERS: '/admin/users',
    ORDERS: '/admin/orders',
    PRODUCTS: '/admin/products',
    SETTINGS: '/admin/settings',
  },

  // Routes CLIENT
  CLIENT: {
    DASHBOARD: '/client/dashboard',
    ORDERS: '/client/orders',
    ORDER_CREATE: '/client/orders/create',
    STORES: '/client/stores',
    PRODUCTS: '/client/products',
    STOCKS: '/client/stocks',
    FINANCES: '/client/finances',
    USERS: '/client/users',
    SETTINGS: '/client/settings',
  },

  // Routes MAGASIN
  STORE: {
    DASHBOARD: '/store/dashboard',
    ORDERS: '/store/orders',
    PREPARATION: '/store/preparation',
    PRODUCTS: '/store/products',
    STOCKS: '/store/stocks',
    DELIVERIES: '/store/deliveries',
    USERS: '/store/users',
    SETTINGS: '/store/settings',
  },
}

/**
 * Retourne la route par défaut selon le rôle de l'utilisateur
 */
export const getDefaultRouteForRole = (role) => {
  switch (role) {
    case 'ADMIN':
      return ROUTES.ADMIN.DASHBOARD
    case 'CLIENT':
      return ROUTES.CLIENT.DASHBOARD
    case 'MANAGER':
    case 'PREPARATEUR':
    case 'LIVREUR':
    case 'COMMERCIAL':
    case 'STOCK_MANAGER':
      return ROUTES.STORE.DASHBOARD
    default:
      return ROUTES.LOGIN
  }
}
