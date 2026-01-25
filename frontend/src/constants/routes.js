/**
 * Définition des routes de l'application
 */

export const ROUTES = {
  // Routes publiques
  LOGIN: '/login',
  VERIFY_EMAIL: '/verify-email',
  HOME: '/',

  // Routes ADMIN
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    CLIENTS: '/admin/clients',
    STORES: '/admin/stores',
    USERS: '/admin/users',
    ORDERS: '/admin/orders',
    PRODUCTS: '/admin/products',
    CATEGORIES: '/admin/categories',
    PRICING: '/admin/pricing',
    SUPPLIERS: '/admin/suppliers',
    SALES: '/admin/sales',
    INVOICES: '/admin/invoices',
    RETURNS: '/admin/returns',
    PAYMENTS: '/admin/payments',
    REPORTS: '/admin/reports',
    ANALYTICS: '/admin/analytics',
    EXPORTS: '/admin/exports',
    EMAILS: '/admin/emails',
    ORDERS_AGGREGATE: '/admin/orders/aggregate',
    SUPPLIER_ORDERS: '/admin/supplier-orders',
    NOTIFICATIONS: '/admin/notifications',
    SETTINGS: '/admin/settings',
  },

  // Routes CLIENT (Magasin individuel)
  CLIENT: {
    DASHBOARD: '/client/dashboard',
    ORDERS: '/client/orders',
    ORDER_CREATE: '/client/orders/create',
    ORDER_DETAIL: '/client/orders/:id',
    PREPARATION: '/client/preparation',
    STORES: '/client/stores',
    STORE_DETAIL: '/client/stores/:id',
    PRODUCTS: '/client/products',
    STOCKS: '/client/stocks',
    SALES: '/client/sales',
    CUSTOMERS: '/client/customers',
    PROMOTIONS: '/client/promotions',
    DELIVERIES: '/client/deliveries',
    FINANCES: '/client/finances',
    NOTIFICATIONS: '/client/notifications',
    USERS: '/client/users',
    SETTINGS: '/client/settings',
  },

  // Routes MANAGER (Propriétaire multi-magasins)
  MANAGER: {
    DASHBOARD: '/manager/dashboard',
    STORES: '/manager/stores',  // Liste de SES magasins
    USERS: '/manager/users',  // Gestion équipes
    ORDERS: '/manager/orders',  // Commandes de SES magasins
    STOCKS: '/manager/stocks',  // Stocks de SES magasins
    SALES: '/manager/sales',  // Ventes de SES magasins
    REPORTS: '/manager/reports',  // Rapports consolidés
    GOALS: '/manager/goals',  // Objectifs
    NOTIFICATIONS: '/manager/notifications',
    SETTINGS: '/manager/settings',
  },

  // Route globale
  HELP: '/help',
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
      return ROUTES.MANAGER.DASHBOARD  // ✅ Route dédiée multi-magasins
    case 'PREPARATEUR':
    case 'LIVREUR':
    case 'COMMERCIAL':
    case 'STOCK_MANAGER':
      return ROUTES.CLIENT.DASHBOARD
    default:
      return ROUTES.LOGIN
  }
}
