import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ClientDashboard from './pages/client/Dashboard';
import ClientOrders from './pages/client/Orders';
import AdminDashboard from './pages/admin/Dashboard';
import PreparateurDashboard from './pages/preparateur/Dashboard';
import LivreurDashboard from './pages/livreur/Dashboard';
import CommercialDashboard from './pages/commercial/Dashboard';
import StockDashboard from './pages/stock/Dashboard';
import FinanceDashboard from './pages/finance/Dashboard';
import ManagerDashboard from './pages/manager/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminProducts from './pages/admin/Products';
import AdminShops from './pages/admin/Shops';
import AdminUsers from './pages/admin/Users';
import AdminStock from './pages/admin/Stock';
import AdminPayments from './pages/admin/Payments';
import AdminSettings from './pages/admin/Settings';
import AdminPreparation from './pages/admin/Preparation';
import AdminNotifications from './pages/admin/Notifications';
import AdminInvoices from './pages/admin/Invoices';
import AdminPromotions from './pages/admin/Promotions';
import DeliveriesCalendar from './pages/admin/DeliveriesCalendar';
import AdminReports from './pages/admin/Reports';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminCategories from './pages/admin/Categories';
import ClientNotifications from './pages/client/Notifications';
import ClientInvoices from './pages/client/Invoices';
import ClientFinance from './pages/client/Finance';
import RecurringOrders from './pages/client/RecurringOrders';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import './App.css';

// Composant pour protéger les routes
const ProtectedRoute = ({ children, requireAdmin = false, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Vérification pour ADMIN
  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/client" />;
  }

  // Vérification pour rôles spécifiques
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Rediriger selon le rôle de l'utilisateur
    if (user.role === 'CLIENT') return <Navigate to="/client" />;
    if (user.role === 'PREPARATEUR') return <Navigate to="/preparateur" />;
    if (user.role === 'LIVREUR') return <Navigate to="/livreur" />;
    if (user.role === 'COMMERCIAL') return <Navigate to="/commercial" />;
    if (user.role === 'STOCK_MANAGER') return <Navigate to="/stock" />;
    if (user.role === 'FINANCE') return <Navigate to="/finance" />;
    if (user.role === 'MANAGER') return <Navigate to="/manager" />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" />;
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Routes Client */}
            <Route
              path="/client"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClientDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/orders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ClientOrders />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/profile"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/notifications"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <Layout>
                    <ClientNotifications />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/finance"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <Layout>
                    <ClientFinance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/invoices"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <Layout>
                    <ClientInvoices />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/recurring-orders"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <Layout>
                    <RecurringOrders />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/preparateur/profile"
              element={
                <ProtectedRoute allowedRoles={['PREPARATEUR', 'MANAGER', 'ADMIN']}>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/livreur/profile"
              element={
                <ProtectedRoute allowedRoles={['LIVREUR', 'MANAGER', 'ADMIN']}>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/commercial/profile"
              element={
                <ProtectedRoute allowedRoles={['COMMERCIAL', 'MANAGER', 'ADMIN']}>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock/profile"
              element={
                <ProtectedRoute allowedRoles={['STOCK_MANAGER', 'MANAGER', 'ADMIN']}>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/profile"
              element={
                <ProtectedRoute allowedRoles={['FINANCE', 'MANAGER', 'ADMIN']}>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/profile"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Routes Préparateur */}
            <Route
              path="/preparateur"
              element={
                <ProtectedRoute allowedRoles={['PREPARATEUR', 'MANAGER', 'ADMIN']}>
                  <Layout>
                    <PreparateurDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Routes Livreur */}
            <Route
              path="/livreur"
              element={
                <ProtectedRoute allowedRoles={['LIVREUR', 'MANAGER', 'ADMIN']}>
                  <Layout>
                    <LivreurDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Routes Commercial */}
            <Route
              path="/commercial"
              element={
                <ProtectedRoute allowedRoles={['COMMERCIAL', 'MANAGER', 'ADMIN']}>
                  <Layout>
                    <CommercialDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Routes Stock Manager */}
            <Route
              path="/stock"
              element={
                <ProtectedRoute allowedRoles={['STOCK_MANAGER', 'MANAGER', 'ADMIN']}>
                  <Layout>
                    <StockDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Routes Finance */}
            <Route
              path="/finance"
              element={
                <ProtectedRoute allowedRoles={['FINANCE', 'MANAGER', 'ADMIN']}>
                  <Layout>
                    <FinanceDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Routes Manager */}
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
                  <Layout>
                    <ManagerDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Routes Admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/preparation"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminPreparation />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminOrders />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminProducts />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/shops"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminShops />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminUsers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stock"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminStock />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminPayments />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminSettings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminNotifications />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/invoices"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminInvoices />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/promotions"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminPromotions />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deliveries/calendar"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <DeliveriesCalendar />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminAuditLogs />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminCategories />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Routes Messages - Tous les rôles */}
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Messages />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Route 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

