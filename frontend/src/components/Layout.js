import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [globalSearch, setGlobalSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    
    // Rediriger vers la page appropriée selon le rôle
    if (user?.role === 'ADMIN') {
      // Recherche dans les commandes
      navigate(`/admin/orders?search=${encodeURIComponent(globalSearch)}`);
    } else {
      // Recherche dans les produits
      navigate(`/client?search=${encodeURIComponent(globalSearch)}`);
    }
    setGlobalSearch('');
    setMobileMenuOpen(false);
  };

  const role = user?.role;

  const adminMenuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/preparation', label: 'Préparation', icon: '📦' },
    { path: '/admin/orders', label: 'Commandes', icon: '📋' },
    { path: '/admin/products', label: 'Produits', icon: '🛍️' },
    { path: '/admin/categories', label: 'Catégories', icon: '📁' },
    { path: '/admin/shops', label: 'Magasins', icon: '🏪' },
    { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
    { path: '/admin/stock', label: 'Stock', icon: '📊' },
    { path: '/admin/payments', label: 'Paiements', icon: '💳' },
    { path: '/admin/invoices', label: 'Factures', icon: '📄' },
    { path: '/admin/promotions', label: 'Promotions', icon: '🏷️' },
    { path: '/admin/deliveries/calendar', label: 'Calendrier', icon: '🗓️' },
    { path: '/admin/reports', label: 'Rapports', icon: '📊' },
    { path: '/admin/audit-logs', label: 'Journal d\'audit', icon: '📋' },
    { path: '/admin/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/admin/settings', label: 'Paramètres', icon: '⚙️' },
  ];

  const clientMenuItems = [
    { path: '/client', label: 'Catalogue', icon: '🛒' },
    { path: '/client/orders', label: 'Mes Commandes', icon: '📋' },
    { path: '/client/finance', label: 'Ma Situation', icon: '💰' },
    { path: '/client/invoices', label: 'Mes Factures', icon: '📄' },
    { path: '/client/recurring-orders', label: 'Commandes Récurrentes', icon: '🔄' },
    { path: '/client/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/client/profile', label: 'Mon Profil', icon: '👤' },
  ];

  const preparateurMenuItems = [
    { path: '/preparateur', label: 'Dashboard', icon: '📦' },
    { path: '/preparateur/profile', label: 'Profil', icon: '👤' },
  ];

  const livreurMenuItems = [
    { path: '/livreur', label: 'Dashboard', icon: '🚚' },
    { path: '/livreur/profile', label: 'Profil', icon: '👤' },
  ];

  const commercialMenuItems = [
    { path: '/commercial', label: 'Dashboard', icon: '💼' },
    { path: '/commercial/profile', label: 'Profil', icon: '👤' },
  ];

  const stockMenuItems = [
    { path: '/stock', label: 'Dashboard', icon: '📦' },
    { path: '/stock/profile', label: 'Profil', icon: '👤' },
  ];

  const financeMenuItems = [
    { path: '/finance', label: 'Dashboard', icon: '💰' },
    { path: '/finance/profile', label: 'Profil', icon: '👤' },
  ];

  const managerMenuItems = [
    { path: '/manager', label: 'Dashboard', icon: '👔' },
    { path: '/admin/orders', label: 'Commandes', icon: '📋' },
    { path: '/admin/products', label: 'Produits', icon: '🛍️' },
    { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
    { path: '/admin/payments', label: 'Paiements', icon: '💳' },
    { path: '/admin/reports', label: 'Rapports', icon: '📊' },
    { path: '/manager/profile', label: 'Profil', icon: '👤' },
  ];

  const getMenuItems = () => {
    switch (role) {
      case 'ADMIN':
        return adminMenuItems;
      case 'CLIENT':
        return clientMenuItems;
      case 'PREPARATEUR':
        return preparateurMenuItems;
      case 'LIVREUR':
        return livreurMenuItems;
      case 'COMMERCIAL':
        return commercialMenuItems;
      case 'STOCK_MANAGER':
        return stockMenuItems;
      case 'FINANCE':
        return financeMenuItems;
      case 'MANAGER':
        return managerMenuItems;
      default:
        return [];
    }
  };

  const getProfilePath = () => {
    switch (role) {
      case 'ADMIN':
        return '/admin/profile';
      case 'CLIENT':
        return '/client/profile';
      case 'PREPARATEUR':
        return '/preparateur/profile';
      case 'LIVREUR':
        return '/livreur/profile';
      case 'COMMERCIAL':
        return '/commercial/profile';
      case 'STOCK_MANAGER':
        return '/stock/profile';
      case 'FINANCE':
        return '/finance/profile';
      case 'MANAGER':
        return '/manager/profile';
      default:
        return '/client/profile';
    }
  };

  const menuItems = getMenuItems();
  const isAdmin = role === 'ADMIN';

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-top">
          <div className="navbar-brand">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2>🍎 Fruits & Légumes</h2>
            </Link>
          </div>
          
          <div className="navbar-search">
            <form onSubmit={handleGlobalSearch}>
              <input
                type="text"
                placeholder={isAdmin ? "Rechercher commandes, clients..." : "Rechercher produits..."}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="global-search-input"
              />
              <button type="submit" className="search-btn" aria-label="Rechercher">
                🔍
              </button>
            </form>
          </div>

          <div className="navbar-actions">
            <Link to="/messages" className="navbar-icon-message" title="Messagerie">
              💬
            </Link>
            <NotificationBell />
            <div className="navbar-user">
              <Link
                to={getProfilePath()}
                className="profile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="profile-icon">👤</span>
                <span className="profile-name">{user?.name}</span>
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                Déconnexion
              </button>
            </div>
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        <div className={`navbar-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;

