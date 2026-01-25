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
import VerifyEmail from './pages/auth/VerifyEmail'

// Pages ADMIN
import AdminDashboard from './pages/admin/Dashboard'
import AdminClients from './pages/admin/Clients'
import AdminStores from './pages/admin/Stores'
import AdminUsers from './pages/admin/Users'
import AdminOrders from './pages/admin/Orders'
import AdminProducts from './pages/admin/Products'
import AdminCategories from './pages/admin/Categories'
import AdminSuppliers from './pages/admin/Suppliers'
import AdminSales from './pages/admin/Sales'
import AdminReports from './pages/admin/Reports'
import AdminAnalytics from './pages/admin/Analytics'
import AdminExports from './pages/admin/Exports'
import AdminEmailTemplates from './pages/admin/EmailTemplates'
import AdminPricing from './pages/admin/Pricing'
import AdminOrdersAggregate from './pages/admin/OrdersAggregate'
import AdminSupplierOrders from './pages/admin/SupplierOrders'
import AdminInvoices from './pages/admin/Invoices'
import AdminReturns from './pages/admin/Returns'
import AdminPayments from './pages/admin/PaymentsManagement'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminSettings from './pages/admin/Settings'

// Pages CLIENT (Magasin individuel)
import ClientDashboard from './pages/client/Dashboard'
import ClientOrders from './pages/client/Orders'
import ClientPreparation from './pages/client/Preparation'
import ClientStores from './pages/client/Stores'
import ClientStocks from './pages/client/Stocks'
import ClientProducts from './pages/client/Products'
import ClientSales from './pages/client/Sales'
import ClientCustomers from './pages/client/Customers'
import ClientPromotions from './pages/client/Promotions'
import ClientDeliveries from './pages/client/Deliveries'
import ClientFinances from './pages/client/Finances'
import ClientNotifications from './pages/client/Notifications'
import ClientUsers from './pages/client/Users'
import ClientSettings from './pages/client/Settings'
import OrderCreate from './pages/client/OrderCreate'
import OrderDetail from './pages/client/OrderDetail'
import StoreDetail from './pages/client/StoreDetail'

// Pages MANAGER
import ManagerDashboard from './pages/manager/Dashboard'
import ManagerStores from './pages/manager/Stores'
import ManagerOrders from './pages/manager/Orders'
import ManagerStocks from './pages/manager/Stocks'
import ManagerSales from './pages/manager/Sales'
import ManagerReports from './pages/manager/Reports'
import ManagerUsers from './pages/manager/Users'
import ManagerGoals from './pages/manager/Goals'
import ManagerNotifications from './pages/manager/Notifications'
import ManagerSettings from './pages/manager/Settings'

// Page globale
import Help from './pages/Help'

// Routes
import { ROUTES, getDefaultRouteForRole } from './constants/routes'
import { useAuth } from './contexts/AuthContext'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  // Si non authentifié : login, vérification email, ou redirection vers login
  if (!user) {
    return (
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    )
  }

  // Utilisateur authentifié - afficher les routes protégées
  const defaultRoute = getDefaultRouteForRole(user.role)

  return (
    <Layout>
      <Routes>
        <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
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
          path={ROUTES.ADMIN.CATEGORIES}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.SUPPLIERS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminSuppliers />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.SALES}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminSales />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.REPORTS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.ANALYTICS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.EXPORTS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminExports />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.EMAILS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminEmailTemplates />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.ORDERS_AGGREGATE}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminOrdersAggregate />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.SUPPLIER_ORDERS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminSupplierOrders />
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
          path={ROUTES.ADMIN.PRICING}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminPricing />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.INVOICES}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminInvoices />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.RETURNS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminReturns />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.PAYMENTS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminPayments />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.NOTIFICATIONS}
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminNotifications />
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
          path={ROUTES.CLIENT.PREPARATION}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientPreparation />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CLIENT.SALES}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientSales />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CLIENT.DELIVERIES}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientDeliveries />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CLIENT.CUSTOMERS}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CLIENT.NOTIFICATIONS}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.CLIENT.PROMOTIONS}
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientPromotions />
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

        {/* Routes MANAGER */}
        <Route
          path={ROUTES.MANAGER.DASHBOARD}
          element={
            <ProtectedRoute requiredRole="MANAGER">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MANAGER.STORES}
          element={
            <ProtectedRoute requiredRole="MANAGER">
              <ManagerStores />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MANAGER.ORDERS}
          element={
            <ProtectedRoute requiredRole="MANAGER">
              <ManagerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MANAGER.STOCKS}
          element={
            <ProtectedRoute requiredRole="MANAGER">
              <ManagerStocks />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MANAGER.SALES}
          element={
            <ProtectedRoute requiredRole="MANAGER">
              <ManagerSales />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MANAGER.REPORTS}
          element={
            <ProtectedRoute requiredRole="MANAGER">
              <ManagerReports />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MANAGER.SETTINGS}
          element={
            <ProtectedRoute requiredRole="MANAGER">
              <ManagerSettings />
            </ProtectedRoute>
          }
        />

        {/* Route globale Help */}
        <Route path={ROUTES.HELP} element={<Help />} />

        {/* Routes existantes (à adapter selon le rôle) */}
        {user.role === 'CLIENT' && (
          <>
            <Route
              path={ROUTES.CLIENT.ORDER_CREATE}
              element={
                <ProtectedRoute requiredRole="CLIENT" requiredResource="orders" requiredAction="create">
                  <OrderCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.CLIENT.ORDER_DETAIL}
              element={
                <ProtectedRoute requiredRole="CLIENT">
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.CLIENT.STORE_DETAIL}
              element={
                <ProtectedRoute requiredRole="CLIENT">
                  <StoreDetail />
                </ProtectedRoute>
              }
            />
          </>
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
