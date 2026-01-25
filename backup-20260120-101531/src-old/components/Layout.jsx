import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingCart,
  Package,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Truck,
  FileText,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../constants/routes'
import { ROLE_LABELS } from '../constants/roles'

/**
 * Composant Layout principal avec navigation
 */
function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  // Définir les menus selon le rôle
  const getMenuItems = () => {
    if (!user) return []

    const role = user.role

    if (role === 'ADMIN') {
      return [
        { path: ROUTES.ADMIN.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
        { path: ROUTES.ADMIN.CLIENTS, label: 'Clients', icon: Users },
        { path: ROUTES.ADMIN.STORES, label: 'Magasins', icon: Store },
        { path: ROUTES.ADMIN.USERS, label: 'Utilisateurs', icon: Users },
        { path: ROUTES.ADMIN.ORDERS, label: 'Commandes', icon: ShoppingCart },
        { path: ROUTES.ADMIN.PRODUCTS, label: 'Produits', icon: Package },
        { path: ROUTES.ADMIN.SETTINGS, label: 'Paramètres', icon: Settings },
      ]
    }

    if (role === 'CLIENT') {
      return [
        { path: ROUTES.CLIENT.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
        { path: ROUTES.CLIENT.ORDERS, label: 'Mes commandes', icon: ShoppingCart },
        { path: ROUTES.CLIENT.STORES, label: 'Mes magasins', icon: Store },
        { path: ROUTES.CLIENT.PRODUCTS, label: 'Produits', icon: Package },
        { path: ROUTES.CLIENT.STOCKS, label: 'Stocks', icon: Package },
        { path: ROUTES.CLIENT.FINANCES, label: 'Finances', icon: DollarSign },
        { path: ROUTES.CLIENT.SETTINGS, label: 'Paramètres', icon: Settings },
      ]
    }

    // Roles MAGASIN (MANAGER, PREPARATEUR, LIVREUR, etc.)
    return [
      { path: ROUTES.STORE.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
      { path: ROUTES.STORE.ORDERS, label: 'Commandes', icon: ShoppingCart },
      { path: ROUTES.STORE.PREPARATION, label: 'Préparation', icon: Package },
      { path: ROUTES.STORE.PRODUCTS, label: 'Produits', icon: Package },
      { path: ROUTES.STORE.STOCKS, label: 'Stocks', icon: Package },
      { path: ROUTES.STORE.DELIVERIES, label: 'Livraisons', icon: Truck },
      { path: ROUTES.STORE.SETTINGS, label: 'Paramètres', icon: Settings },
    ]
  }

  const menuItems = getMenuItems()
  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto w-64 bg-white border-r border-gray-200`}
      >
        <div className="h-full flex flex-col">
          {/* Logo / Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-primary-600">Fruits & Légumes</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {user && (
              <p className="text-sm text-gray-600 mt-2">
                {ROLE_LABELS[user.role] || user.role}
              </p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-primary-50 text-primary-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1"></div>
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

export default Layout
