import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PERMISSIONS, ACTIONS } from '../constants/permissions'

/**
 * Hook pour vérifier les permissions d'un utilisateur
 */
export function usePermission(resource) {
  const { user } = useAuth()

  const permissions = useMemo(() => {
    if (!user || !user.role) return []
    return PERMISSIONS[user.role]?.[resource] || []
  }, [user, resource])

  const canRead = permissions.includes(ACTIONS.READ)
  const canCreate = permissions.includes(ACTIONS.CREATE)
  const canUpdate = permissions.includes(ACTIONS.UPDATE)
  const canDelete = permissions.includes(ACTIONS.DELETE)

  return {
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    permissions,
  }
}
