import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionBusyIds, setActionBusyIds] = useState(() => new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('TOUS');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CLIENT'
  });
  const [resetPasswordData, setResetPasswordData] = useState({
    userId: '',
    newPassword: ''
  });

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchUsers(1);
  }, [searchTerm, filterRole]);

  const fetchUsers = async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', itemsPerPage);
      
      const response = await api.get(`/admin/users?${params.toString()}`);
      
      if (response.data.success && response.data.users) {
        // Filtrer côté client pour recherche et rôle
        let filteredUsers = response.data.users;
        
        if (searchTerm) {
          filteredUsers = filteredUsers.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.shop && user.shop.name.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }
        
        if (filterRole !== 'TOUS') {
          filteredUsers = filteredUsers.filter(user => user.role === filterRole);
        }
        
        setUsers(filteredUsers);
        
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role
    });
    setShowForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (submitting || !selectedUser) return; // Phase 2: prevent double submit
    
    try {
      setSubmitting(true); // Phase 2: disable UI to prevent double-submit
      await api.put(`/admin/users/${selectedUser.id}`, formData);
      toast.success('Utilisateur modifié avec succès');
      resetForm();
      fetchUsers(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (userId) => {
    if (actionBusyIds.has(userId)) return; // Phase 2: prevent double click
    const newPassword = prompt('Entrez le nouveau mot de passe (minimum 6 caractères):');
    if (!newPassword || newPassword.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caractères');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ?')) {
      return;
    }

    try {
      setActionBusyIds(prev => new Set(prev).add(userId));
      await api.put(`/admin/users/${userId}/password`, { newPassword });
      toast.success('Mot de passe réinitialisé avec succès');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la réinitialisation');
    } finally {
      setActionBusyIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleDelete = async (userId) => {
    if (actionBusyIds.has(userId)) return; // Phase 2: prevent double click
    const user = users.find(u => u.id === userId);
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.name}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      setActionBusyIds(prev => new Set(prev).add(userId));
      await api.delete(`/admin/users/${userId}`);
      toast.success('Utilisateur supprimé avec succès');
      fetchUsers(currentPage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setActionBusyIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'CLIENT'
    });
    setSelectedUser(null);
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));
    const matchesRole = filterRole === 'TOUS' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="loading">Chargement des utilisateurs...</div>;
  }

  return (
    <div className="admin-users">
      <div className="users-header">
        <h1>Gestion des Utilisateurs</h1>
      </div>

      {/* Filtres */}
      <div className="users-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="role-filter">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="role-select"
          >
            <option value="TOUS">Tous les rôles</option>
            <option value="ADMIN">Administrateurs</option>
            <option value="CLIENT">Clients</option>
          </select>
        </div>
        <div className="users-count">
          {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Formulaire de modification */}
      {showForm && selectedUser && (
        <div className="user-form-card">
          <h2>Modifier l'utilisateur</h2>
          <form onSubmit={handleUpdate}>
            <div className="form-row">
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Rôle *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="CLIENT">Client</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {submitting ? 'Enregistrement...' : 'Modifier'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau des utilisateurs */}
      <div className="users-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Rôle</th>
              <th>Magasin</th>
              <th>Inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  {searchTerm || filterRole !== 'TOUS' 
                    ? 'Aucun utilisateur ne correspond à votre recherche' 
                    : 'Aucun utilisateur'}
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td>{user.phone || '—'}</td>
                  <td>
                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                      {user.role === 'ADMIN' ? '👑 Admin' : '👤 Client'}
                    </span>
                  </td>
                  <td>{user.shop?.name || '—'}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(user)}
                        className="btn btn-info btn-sm"
                        disabled={submitting}
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="btn btn-warning btn-sm"
                        title="Réinitialiser le mot de passe"
                        disabled={actionBusyIds.has(user.id)}
                      >
                        🔑
                      </button>
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn btn-danger btn-sm"
                          disabled={actionBusyIds.has(user.id)}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!searchTerm && filterRole === 'TOUS' && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="pagination-btn"
          >
            Précédent
          </button>
          <div className="pagination-info">
            Page {currentPage} sur {pagination.totalPages} ({pagination.total} utilisateurs)
          </div>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            let pageNum;
            if (pagination.totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= pagination.totalPages - 2) {
              pageNum = pagination.totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="pagination-btn"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

