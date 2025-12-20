import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './AdminAuditLogs.css';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Filtres
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Classification personnalisée
  const [classifications, setClassifications] = useState({
    groupBy: 'none', // none, action, entity, user, date
    showDetails: true,
    highlightRecent: true,
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters, pagination.page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
      });

      const response = await api.get(`/admin/audit-logs?${params}`);
      setLogs(response.data.logs || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.totalPages || 0,
      }));
    } catch (error) {
      console.error('Erreur récupération logs:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du chargement des logs';
      toast.error(errorMessage);
      // En cas d'erreur, initialiser avec des valeurs par défaut
      setLogs([]);
      setPagination((prev) => ({
        ...prev,
        total: 0,
        totalPages: 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/admin/audit-logs/stats?${params}`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      // Ne pas bloquer l'affichage si les stats échouent
      setStats(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClassificationChange = (key, value) => {
    setClassifications((prev) => ({ ...prev, [key]: value }));
  };

  const getActionColor = (action) => {
    const colors = {
      CREATE: '#10b981',
      UPDATE: '#3b82f6',
      DELETE: '#ef4444',
      VIEW: '#6b7280',
      LOGIN: '#8b5cf6',
      LOGOUT: '#f59e0b',
    };
    return colors[action] || '#6b7280';
  };

  const getEntityIcon = (entity) => {
    const icons = {
      Product: '📦',
      Order: '🛒',
      User: '👤',
      Shop: '🏪',
      Payment: '💰',
      Stock: '📊',
      Settings: '⚙️',
      Promotion: '🎁',
      Delivery: '🚚',
    };
    return icons[entity] || '📄';
  };

  const formatChanges = (changes) => {
    if (!changes) return null;
    if (typeof changes === 'string') {
      try {
        changes = JSON.parse(changes);
      } catch {
        return changes;
      }
    }
    if (typeof changes === 'object') {
      return JSON.stringify(changes, null, 2);
    }
    return String(changes);
  };

  const groupLogs = (logs) => {
    if (classifications.groupBy === 'none') return { 'Tous les logs': logs };

    const grouped = {};
    logs.forEach((log) => {
      let key;
      switch (classifications.groupBy) {
        case 'action':
          key = log.action;
          break;
        case 'entity':
          key = log.entity;
          break;
        case 'user':
          key = log.user?.name || log.user?.email || 'Utilisateur inconnu';
          break;
        case 'date':
          key = format(new Date(log.createdAt), 'dd/MM/yyyy', { locale: fr });
          break;
        default:
          key = 'Tous les logs';
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    });

    return grouped;
  };

  const groupedLogs = groupLogs(logs);

  const isRecent = (date) => {
    const logDate = new Date(date);
    const now = new Date();
    const diffHours = (now - logDate) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  return (
    <div className="admin-audit-logs">
      <div className="audit-header">
        <h1>📋 Journal d'audit et accès</h1>
        <p>Visualisez toutes les modifications et accès avec classification personnalisée</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="audit-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total des logs</div>
          </div>
          {stats.byAction?.slice(0, 5).map((stat) => (
            <div key={stat.action} className="stat-card">
              <div className="stat-value" style={{ color: getActionColor(stat.action) }}>
                {stat._count.id}
              </div>
              <div className="stat-label">{stat.action}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="audit-filters">
        <div className="filter-group">
          <label>Action</label>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">Toutes</option>
            <option value="CREATE">Création</option>
            <option value="UPDATE">Modification</option>
            <option value="DELETE">Suppression</option>
            <option value="VIEW">Consultation</option>
            <option value="LOGIN">Connexion</option>
            <option value="LOGOUT">Déconnexion</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Entité</label>
          <select
            value={filters.entity}
            onChange={(e) => handleFilterChange('entity', e.target.value)}
          >
            <option value="">Toutes</option>
            <option value="Product">Produit</option>
            <option value="Order">Commande</option>
            <option value="User">Utilisateur</option>
            <option value="Shop">Magasin</option>
            <option value="Payment">Paiement</option>
            <option value="Stock">Stock</option>
            <option value="Settings">Paramètres</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date début</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Date fin</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Recherche</label>
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Trier par</label>
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
          >
            <option value="createdAt-desc">Date récente</option>
            <option value="createdAt-asc">Date ancienne</option>
            <option value="action-asc">Action (A-Z)</option>
            <option value="entity-asc">Entité (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Classification */}
      <div className="audit-classification">
        <h3>🎨 Classification personnalisée</h3>
        <div className="classification-controls">
          <div className="control-group">
            <label>Grouper par :</label>
            <select
              value={classifications.groupBy}
              onChange={(e) => handleClassificationChange('groupBy', e.target.value)}
            >
              <option value="none">Aucun groupement</option>
              <option value="action">Action</option>
              <option value="entity">Entité</option>
              <option value="user">Utilisateur</option>
              <option value="date">Date</option>
            </select>
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={classifications.showDetails}
                onChange={(e) => handleClassificationChange('showDetails', e.target.checked)}
              />
              Afficher les détails
            </label>
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={classifications.highlightRecent}
                onChange={(e) => handleClassificationChange('highlightRecent', e.target.checked)}
              />
              Mettre en évidence les récents (&lt; 24h)
            </label>
          </div>
        </div>
      </div>

      {/* Liste des logs groupés */}
      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="audit-logs-list">
          {Object.entries(groupedLogs).map(([groupKey, groupLogs]) => (
            <div key={groupKey} className="log-group">
              {classifications.groupBy !== 'none' && (
                <div className="group-header">
                  <h3>{groupKey}</h3>
                  <span className="group-count">({groupLogs.length} log{groupLogs.length > 1 ? 's' : ''})</span>
                </div>
              )}

              <div className="logs-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date/Heure</th>
                      <th>Action</th>
                      <th>Entité</th>
                      <th>Utilisateur</th>
                      <th>ID Entité</th>
                      {classifications.showDetails && <th>Détails</th>}
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupLogs.map((log) => (
                      <tr
                        key={log.id}
                        className={
                          classifications.highlightRecent && isRecent(log.createdAt) ? 'recent' : ''
                        }
                      >
                        <td className="date-cell">
                          {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                        </td>
                        <td>
                          <span
                            className="action-badge"
                            style={{ backgroundColor: getActionColor(log.action) }}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <span className="entity-cell">
                            {getEntityIcon(log.entity)} {log.entity}
                          </span>
                        </td>
                        <td>
                          {log.user ? (
                            <div className="user-cell">
                              <strong>{log.user.name}</strong>
                              <small>{log.user.email}</small>
                              <span className="role-badge">{log.user.role}</span>
                            </div>
                          ) : (
                            <span className="no-user">Système</span>
                          )}
                        </td>
                        <td>
                          <code className="entity-id">{log.entityId}</code>
                        </td>
                        {classifications.showDetails && (
                          <td className="details-cell">
                            {log.changes && (
                              <details>
                                <summary>Voir les modifications</summary>
                                <pre>{formatChanges(log.changes)}</pre>
                              </details>
                            )}
                            {log.userAgent && (
                              <small className="user-agent">{log.userAgent}</small>
                            )}
                          </td>
                        )}
                        <td>
                          <code className="ip-address">{log.ip || '-'}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {logs.length === 0 && !loading && (
            <div className="no-logs">Aucun log trouvé avec ces filtres</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="audit-pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            Précédent
          </button>
          <span>
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} logs)
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
