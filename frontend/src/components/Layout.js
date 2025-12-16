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

  const isAdmin = user?.role === 'ADMIN';
  const isClient = user?.role === 'CLIENT';

  const adminMenuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/preparation', label: 'Préparation', icon: '📦' },
    { path: '/admin/orders', label: 'Commandes', icon: '📋' },
    { path: '/admin/products', label: 'Produits', icon: '🛍️' },
    { path: '/admin/shops', label: 'Magasins', icon: '🏪' },
    { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
    { path: '/admin/stock', label: 'Stock', icon: '📊' },
    { path: '/admin/payments', label: 'Paiements', icon: '💳' },
    { path: '/admin/settings', label: 'Paramètres', icon: '⚙️' },
  ];

  const clientMenuItems = [
    { path: '/client', label: 'Catalogue', icon: '🛒' },
    { path: '/client/orders', label: 'Mes Commandes', icon: '📋' },
  ];

  const menuItems = isAdmin ? adminMenuItems : clientMenuItems;

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-top">
          <div className="navbar-brand">
            <h2>🍎 Fruits & Légumes</h2>
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
            {isAdmin && <NotificationBell />}
            <div className="navbar-user">
              <Link
                to={isAdmin ? "/admin/profile" : "/client/profile"}
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

