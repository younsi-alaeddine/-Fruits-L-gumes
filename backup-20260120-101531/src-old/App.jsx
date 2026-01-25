import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { StoreProvider } from './contexts/StoreContext'
import { CartProvider } from './contexts/CartContext'
import { OrderProvider } from './contexts/OrderContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import Layout from './components/Layout'
import ProtectedRoute from './components/common/ProtectedRoute'

// Pages d'authentification
import Login from './pages/auth/Login'

// Pages ADMIN
import AdminDashboard from './pages/admin/Dashboard'
import AdminClients from './pages/admin/Clients'
import AdminStores from './pages/admin/Stores'
import AdminUsers from './pages/admin/Users'
import AdminOrders from './pages/admin/Orders'
import AdminProducts from './pages/admin/Products'
import AdminSettings from './pages/admin/Settings'

// Pages CLIENT
import ClientDashboard from './pages/client/Dashboard'
import ClientOrders from './pages/client/Orders'
import ClientStores from './pages/client/Stores'
import ClientStocks from './pages/client/Stocks'
import ClientProducts from './pages/client/Products'
import ClientFinances from './pages/client/Finances'
import ClientUsers from './pages/client/Users'
import ClientSettings from './pages/client/Settings'
import OrderCreate from './pages/client/OrderCreate'

// Pages MAGASIN
import StoreDashboard from './pages/store/Dashboard'
import StoreOrders from './pages/store/Orders'
import StoreProducts from './pages/store/Products'
import StoreStocks from './pages/store/Stocks'
import StoreDeliveries from './pages/store/Deliveries'
import StoreUsers from './pages/store/Users'
import StoreSettings from './pages/store/Settings'
import Preparation from './pages/store/Preparation'

// Pages existantes
import OrderPage from './pages/OrderPage'
import OrderHistory from './pages/OrderHistory'

// Routes
import { ROUTES, getDefaultRouteForRole } from './constants/routes'
import { useAuth } from './contexts/AuthContext'

function AppRoutes() {
  const { user, loading } = useAuth()

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

  // Si non authentifié, rediriger vers login
  if (!user) {
    return (
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    )
  }

  // Utilisateur authentifié - afficher les routes protégées
  const defaultRoute = getDefaultRouteForRole(user.role)

  return (
    <Layout>
      <Routes>
        {/* Routes ADMIN */}
        <Route
          path={ROUTES.ADMIN.DASHBOARD}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.CLIENTS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminClients />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.STORES}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminStores />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.ORDERS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.PRODUCTS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.USERS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.SETTINGS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminSettings />
            </ProtectedRoute>
          }
        />

        {/* Routes CLIENT */}
        <Route
          path={ROUTES.CLIENT.DASHBOARD}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CLIENT.ORDERS}
          element={
            <ProtectedRoute requiredRole="CLIENT" requiredResource="orders" requiredAction="read">
              <ClientOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CLIENT.STORES}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientStores />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CLIENT.FINANCES}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientFinances />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CLIENT.PRODUCTS}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CLIENT.STOCKS}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientStocks />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CLIENT.USERS}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CLIENT.SETTINGS}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientSettings />
            </ProtectedRoute>
          }
        />

        {/* Routes MAGASIN */}
        <Route
          path={ROUTES.STORE.DASHBOARD}
          element={
            <ProtectedRoute>
              <StoreDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STORE.ORDERS}
          element={
            <ProtectedRoute requiredResource="orders" requiredAction="read">
              <StoreOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STORE.PREPARATION}
          element={
            <ProtectedRoute>
              <Preparation />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STORE.PRODUCTS}
          element={
            <ProtectedRoute>
              <StoreProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STORE.STOCKS}
          element={
            <ProtectedRoute>
              <StoreStocks />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STORE.DELIVERIES}
          element={
            <ProtectedRoute>
              <StoreDeliveries />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STORE.USERS}
          element={
            <ProtectedRoute>
              <StoreUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.STORE.SETTINGS}
          element={
            <ProtectedRoute>
              <StoreSettings />
            </ProtectedRoute>
          }
        />

        {/* Routes existantes (à adapter selon le rôle) */}
        {/* Route création de commande pour CLIENT */}
        {user.role === 'CLIENT' && (
          <Route
            path="/commandes/nouvelle"
            element={
              <ProtectedRoute requiredRole="CLIENT" requiredResource="orders" requiredAction="create">
                <OrderCreate />
              </ProtectedRoute>
            }
          />
        )}

        {/* Route par défaut */}
        <Route
          path="/"
          element={<Navigate to={defaultRoute} replace />}
        />

        {/* Route par défaut */}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <OrderProvider>
              <Router>
                <AppRoutes />
              </Router>
            </OrderProvider>
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
