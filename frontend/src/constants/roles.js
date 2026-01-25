/**
 * Définition des rôles de l'application
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
  MANAGER: 'MANAGER',
  PREPARATEUR: 'PREPARATEUR',
  LIVREUR: 'LIVREUR',
  COMMERCIAL: 'COMMERCIAL',
  STOCK_MANAGER: 'STOCK_MANAGER',
  FINANCE: 'FINANCE',
}

/**
 * Labels des rôles (pour affichage)
 */
export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrateur',
  [ROLES.CLIENT]: 'Client',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.PREPARATEUR]: 'Préparateur',
  [ROLES.LIVREUR]: 'Livreur',
  [ROLES.COMMERCIAL]: 'Commercial',
  [ROLES.STOCK_MANAGER]: 'Gestionnaire de stock',
  [ROLES.FINANCE]: 'Finance',
}
