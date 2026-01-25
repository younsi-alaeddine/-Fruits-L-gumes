import React from 'react'
import { Store } from 'lucide-react'
import { useStore } from '../../contexts/StoreContext'

/**
 * Composant de sélection de magasin pour les CLIENTs
 */
function StoreSelector() {
  const { stores, selectedStoreId, selectStore } = useStore()

  if (!stores || stores.length === 0) {
    return null
  }

  const validStores = stores.filter((store) => store && store.id && store.name)

  if (validStores.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      <Store className="h-5 w-5 text-gray-400" />
      <select
        value={selectedStoreId || ''}
        onChange={(e) => selectStore(e.target.value || null)}
        className="input"
      >
        <option value="">Tous les magasins</option>
        {validStores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default StoreSelector
