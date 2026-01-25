import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Package, Users, ShoppingCart, Store, User, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { globalSearch } from '../api/search'
import { ROUTES } from '../constants/routes'

function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef(null)
  const resultsRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false)
        setQuery('')
        setResults(null)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setQuery('')
        setResults(null)
      } else if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setIsOpen(true)
        searchRef.current?.querySelector('input')?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await globalSearch(query)
        setResults(data.results)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Erreur recherche:', error)
        setResults(null)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleResultClick = (type, item) => {
    setIsOpen(false)
    setQuery('')
    setResults(null)

    switch (type) {
      case 'product':
        navigate(`${ROUTES.ADMIN.PRODUCTS}?highlight=${item.id}`)
        break
      case 'client':
        navigate(`${ROUTES.ADMIN.CLIENTS}?highlight=${item.id}`)
        break
      case 'order':
        navigate(`${ROUTES.ADMIN.ORDERS}?highlight=${item.id}`)
        break
      case 'user':
        navigate(`${ROUTES.ADMIN.USERS}?highlight=${item.id}`)
        break
      case 'store':
        navigate(`${ROUTES.ADMIN.STORES}?highlight=${item.id}`)
        break
      default:
        break
    }
  }

  const getResultIcon = (type) => {
    const icons = {
      product: Package,
      client: Users,
      order: ShoppingCart,
      user: User,
      store: Store
    }
    return icons[type] || Package
  }

  const getResultLabel = (type) => {
    const labels = {
      product: 'Produit',
      client: 'Client',
      order: 'Commande',
      user: 'Utilisateur',
      store: 'Magasin'
    }
    return labels[type] || type
  }

  const allResults = results ? [
    ...results.products.map(r => ({ ...r, type: 'product' })),
    ...results.clients.map(r => ({ ...r, type: 'client' })),
    ...results.orders.map(r => ({ ...r, type: 'order' })),
    ...results.users.map(r => ({ ...r, type: 'user' })),
    ...results.stores.map(r => ({ ...r, type: 'store' }))
  ] : []

  return (
    <div ref={searchRef} className="relative">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher... (Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults(null)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Résultats */}
      {isOpen && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
        >
          {loading ? (
            <div className="p-8 text-center">
              <Loader className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Recherche en cours...</p>
            </div>
          ) : query.length < 2 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-600">Tapez au moins 2 caractères</p>
            </div>
          ) : allResults.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-600">Aucun résultat trouvé</p>
            </div>
          ) : (
            <div className="py-2">
              {results && (
                <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    {allResults.length} résultat{allResults.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Groupes de résultats */}
              {results?.products.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Produits</p>
                  </div>
                  {results.products.map((item, idx) => {
                    const Icon = getResultIcon('product')
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick('product', item)}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                      >
                        <Icon className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.category?.name} • {item.sku}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.price?.toFixed(2)} €
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}

              {results?.clients.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Clients</p>
                  </div>
                  {results.clients.map((item) => {
                    const Icon = getResultIcon('client')
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick('client', item)}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                      >
                        <Icon className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.city} • {item.email}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {results?.orders.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Commandes</p>
                  </div>
                  {results.orders.map((item) => {
                    const Icon = getResultIcon('order')
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick('order', item)}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                      >
                        <Icon className="h-5 w-5 text-orange-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.orderNumber || item.id.substring(0, 8)}</p>
                          <p className="text-xs text-gray-500">
                            {item.shop?.name} • {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.totalTTC?.toFixed(2)} €
                        </p>
                      </button>
                    )
                  })}
                </div>
              )}

              {results?.users.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Utilisateurs</p>
                  </div>
                  {results.users.map((item) => {
                    const Icon = getResultIcon('user')
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick('user', item)}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                      >
                        <Icon className="h-5 w-5 text-purple-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.name || item.email}</p>
                          <p className="text-xs text-gray-500">{item.email} • {item.role}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {results?.stores.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Magasins</p>
                  </div>
                  {results.stores.map((item) => {
                    const Icon = getResultIcon('store')
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick('store', item)}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition-colors"
                      >
                        <Icon className="h-5 w-5 text-indigo-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.address} • {item.city} {item.postalCode}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
