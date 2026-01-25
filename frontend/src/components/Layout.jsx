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
  TrendingUp,
  Factory,
  BarChart3,
  Tag,
  Receipt,
  UserPlus,
  Bell,
  RotateCcw,
  Target,
  Percent,
  CreditCard,
  Download,
  Mail,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../constants/routes'
import { ROLE_LABELS } from '../constants/roles'
import NotificationCenter from './NotificationCenter'
import GlobalSearch from './GlobalSearch'

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
        { path: ROUTES.ADMIN.ORDERS_AGGREGATE, label: 'Agrégation', icon: Package },
        { path: ROUTES.ADMIN.SUPPLIER_ORDERS, label: 'Commandes Fournisseur', icon: Factory },
        { path: ROUTES.ADMIN.PRODUCTS, label: 'Produits', icon: Package },
        { path: ROUTES.ADMIN.CATEGORIES, label: 'Catégories', icon: Tag },
        { path: ROUTES.ADMIN.PRICING, label: 'Tarification', icon: Tag },
        { path: ROUTES.ADMIN.SUPPLIERS, label: 'Fournisseurs', icon: Factory },
        { path: ROUTES.ADMIN.SALES, label: 'Ventes', icon: DollarSign },
        { path: ROUTES.ADMIN.INVOICES, label: 'Facturation', icon: Receipt },
        { path: ROUTES.ADMIN.PAYMENTS, label: 'Paiements', icon: CreditCard },
        { path: ROUTES.ADMIN.RETURNS, label: 'Retours', icon: RotateCcw },
        { path: ROUTES.ADMIN.REPORTS, label: 'Rapports', icon: BarChart3 },
        { path: ROUTES.ADMIN.ANALYTICS, label: 'Analytics', icon: TrendingUp },
        { path: ROUTES.ADMIN.EXPORTS, label: 'Exports', icon: Download },
        { path: ROUTES.ADMIN.EMAILS, label: 'Emails', icon: Mail },
        { path: ROUTES.ADMIN.NOTIFICATIONS, label: 'Notifications', icon: Bell },
        { path: ROUTES.ADMIN.SETTINGS, label: 'Paramètres', icon: Settings },
      ]
    }

    if (role === 'CLIENT') {
      return [
        { path: ROUTES.CLIENT.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
        { path: ROUTES.CLIENT.ORDERS, label: 'Commandes', icon: ShoppingCart },
        { path: ROUTES.CLIENT.PREPARATION, label: 'Préparation', icon: Package },
        { path: ROUTES.CLIENT.PRODUCTS, label: 'Produits', icon: Package },
        { path: ROUTES.CLIENT.STOCKS, label: 'Stocks', icon: Package },
        { path: ROUTES.CLIENT.SALES, label: 'Ventes', icon: DollarSign },
        { path: ROUTES.CLIENT.CUSTOMERS, label: 'Clients', icon: UserPlus },
        { path: ROUTES.CLIENT.PROMOTIONS, label: 'Promotions', icon: Percent },
        { path: ROUTES.CLIENT.DELIVERIES, label: 'Livraisons', icon: Truck },
        { path: ROUTES.CLIENT.FINANCES, label: 'Finances', icon: DollarSign },
        { path: ROUTES.CLIENT.NOTIFICATIONS, label: 'Notifications', icon: Bell },
        { path: ROUTES.CLIENT.SETTINGS, label: 'Paramètres', icon: Settings },
      ]
    }

    if (role === 'MANAGER') {
      return [
        { path: ROUTES.MANAGER.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
        { path: ROUTES.MANAGER.STORES, label: 'Mes Magasins', icon: Store },
        { path: ROUTES.MANAGER.USERS, label: 'Équipes', icon: Users },
        { path: ROUTES.MANAGER.ORDERS, label: 'Commandes', icon: ShoppingCart },
        { path: ROUTES.MANAGER.STOCKS, label: 'Stocks', icon: Package },
        { path: ROUTES.MANAGER.SALES, label: 'Ventes', icon: DollarSign },
        { path: ROUTES.MANAGER.REPORTS, label: 'Rapports', icon: BarChart3 },
        { path: ROUTES.MANAGER.GOALS, label: 'Objectifs', icon: Target },
        { path: ROUTES.MANAGER.NOTIFICATIONS, label: 'Notifications', icon: Bell },
        { path: ROUTES.MANAGER.SETTINGS, label: 'Paramètres', icon: Settings },
      ]
    }

    // Sous-rôles CLIENT (PREPARATEUR, LIVREUR, etc.) - utilisent aussi l'interface CLIENT
    return [
      { path: ROUTES.CLIENT.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
      { path: ROUTES.CLIENT.ORDERS, label: 'Commandes', icon: ShoppingCart },
      { path: ROUTES.CLIENT.PREPARATION, label: 'Préparation', icon: Package },
      { path: ROUTES.CLIENT.PRODUCTS, label: 'Produits', icon: Package },
      { path: ROUTES.CLIENT.STOCKS, label: 'Stocks', icon: Package },
      { path: ROUTES.CLIENT.SALES, label: 'Ventes', icon: DollarSign },
      { path: ROUTES.CLIENT.DELIVERIES, label: 'Livraisons', icon: Truck },
      { path: ROUTES.CLIENT.SETTINGS, label: 'Paramètres', icon: Settings },
    ]
  }

  const menuItems = getMenuItems()
  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:relative lg:z-auto w-64 bg-white border-r border-gray-200 lg:flex-shrink-0 shadow-xl lg:shadow-none`}
      >
        <div className="h-full flex flex-col">
          {/* Logo / Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-primary-50 to-white">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gradient animate-fade-in">Fruits & Légumes</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {user && (
              <p className="text-sm text-gray-600 mt-2 animate-slide-in-right">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <li 
                    key={item.path}
                    className="animate-slide-in-right"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        isActive(item.path)
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-md'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-sm hover:translate-x-1'
                      }`}
                    >
                      <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                        isActive(item.path) ? 'animate-bounce-in' : ''
                      }`} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleLogout}
              className="group flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-300 hover:shadow-md"
            >
              <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              <span className="font-medium">Déconnexion</span>
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
      <div className="lg:flex-1 lg:overflow-hidden">
        {/* Top bar */}
        <header className="glass bg-white/95 border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between">
            {/* Menu hamburger (mobile) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-primary-600 transition-all hover:scale-110 active:scale-95"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Barre de recherche globale */}
            <div className="flex-1 max-w-2xl mx-4 hidden md:block">
              <GlobalSearch />
            </div>
            
            {/* Espace vide pour pousser notifications + user à droite */}
            <div className="flex-1 md:hidden"></div>
            
            {/* ✅ NOTIFICATIONS + USER - Alignés à DROITE */}
            {user && (
              <div className="flex items-center space-x-3 lg:space-x-5">
                {/* Centre de notifications */}
                <NotificationCenter />
                
                {/* User info */}
                <div className="flex items-center space-x-3 group">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur'}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg transition-all group-hover:scale-110 overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>
                        {((user.name || '').split(' ').filter(Boolean).map((p) => p.charAt(0)).slice(0, 2).join('') || (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '') || 'U').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 md:p-4 lg:p-6 pb-6 md:pb-8">{children}</main>
      </div>
    </div>
  )
}

export default Layout
