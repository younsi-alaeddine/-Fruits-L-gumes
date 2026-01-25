import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROUTES } from '../../constants/routes'
import { usePermission } from '../../hooks/usePermission'
import { RESOURCES, ACTIONS } from '../../constants/permissions'

/**
 * Composant de protection de route
 */
function ProtectedRoute({
  children,
  requiredRole,
  requiredResource,
  requiredAction,
  requiredRoles = [],
}) {
  const { user, loading } = useAuth()
  const { canRead } = usePermission(requiredResource || RESOURCES.ORDERS)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  // Vérifier le rôle requis
  if (requiredRole && user.role !== requiredRole) {
    if (requiredRoles.length > 0 && requiredRoles.includes(user.role)) {
      // Rôle autorisé
    } else if (requiredRoles.length === 0) {
      return <Navigate to={ROUTES.LOGIN} replace />
    }
  }

  // Vérifier la permission pour une ressource spécifique
  if (requiredResource && requiredAction) {
    if (requiredAction === ACTIONS.READ && !canRead) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
            <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
