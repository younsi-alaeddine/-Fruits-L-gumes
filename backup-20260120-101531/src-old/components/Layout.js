import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout, setActiveShopId } = useAuth();
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
  const shops = user?.shops || [];
  const activeShopId = user?.shop?.id || localStorage.getItem('activeShopId') || '';

  const adminMenuItems = [
    { path: '/admin', label: 'Tableau de bord', icon: '📊' },
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
    { path: '/client', label: 'Accueil', icon: '🏠' },
    { path: '/client/commande', label: 'Commande', icon: '📦' },
    { path: '/client/orders?tab=upcoming', label: 'Livraisons à venir', icon: '🚚' },
    { path: '/client/orders?tab=history', label: 'Historique', icon: '📋' },
    { path: '/client/recurring-orders', label: 'Planning', icon: '📅' },
    { path: '/client/quotes', label: 'Devis', icon: '🏷️' },
    { path: '/messages', label: 'Contact', icon: '✉️' },
    { path: '/client/finance', label: 'Finance', icon: '💰' },
    // Notifications et Profil sont accessibles via le header (NotificationBell et nom utilisateur)
  ];

  const preparateurMenuItems = [
    { path: '/preparateur', label: 'Tableau de bord', icon: '📦' },
    { path: '/preparateur/orders', label: 'Commandes à Préparer', icon: '📋' },
    { path: '/preparateur/statistics', label: 'Statistiques', icon: '📊' },
    { path: '/preparateur/profile', label: 'Profil', icon: '👤' },
  ];

  const livreurMenuItems = [
    { path: '/livreur', label: 'Tableau de bord', icon: '🚚' },
    { path: '/livreur/deliveries', label: 'Mes Livraisons', icon: '📦' },
    { path: '/livreur/profile', label: 'Profil', icon: '👤' },
  ];

  const commercialMenuItems = [
    { path: '/commercial', label: 'Tableau de bord', icon: '💼' },
    { path: '/commercial/profile', label: 'Profil', icon: '👤' },
  ];

  const stockMenuItems = [
    { path: '/stock', label: 'Tableau de bord', icon: '📦' },
    { path: '/stock/products', label: 'Gestion Stock', icon: '📊' },
    { path: '/stock/alerts', label: 'Alertes', icon: '🚨' },
    { path: '/stock/profile', label: 'Profil', icon: '👤' },
  ];

  const financeMenuItems = [
    { path: '/finance', label: 'Tableau de bord', icon: '💰' },
    { path: '/finance/invoices', label: 'Factures', icon: '📄' },
    { path: '/finance/payments', label: 'Paiements', icon: '💳' },
    { path: '/finance/profile', label: 'Profil', icon: '👤' },
  ];

  const managerMenuItems = [
    { path: '/manager', label: 'Tableau de bord', icon: '👔' },
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
            {shops.length > 1 && (
              <div className="navbar-shop-selector" title="Magasin actif">
                <select
                  value={activeShopId}
                  onChange={(e) => setActiveShopId(e.target.value)}
                  className="shop-selector"
                  aria-label="Sélection du magasin"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.city ? ` - ${s.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="navbar-user">
              <Link
                to={getProfilePath()}
                className="profile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="profile-icon">👤</span>
                <span className="profile-name">{user?.name}</span>
              </Link>
            </div>
            <button 
              onClick={handleLogout} 
              className="btn-logout-direct"
              title="Déconnexion"
            >
              🚪 Déconnexion
            </button>
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
            const [itemPath, itemSearch] = item.path.split('?');
            const isPathActive =
              location.pathname === itemPath ||
              (itemPath !== '/admin' && location.pathname.startsWith(itemPath));
            const isActive = itemSearch ? (isPathActive && location.search === `?${itemSearch}`) : isPathActive;
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
          {/* Déconnexion uniquement dans le menu mobile (le bouton du header est pour desktop) */}
          <button 
            onClick={handleLogout} 
            className="nav-link btn-logout-mobile"
            title="Déconnexion"
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Déconnexion</span>
          </button>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;

