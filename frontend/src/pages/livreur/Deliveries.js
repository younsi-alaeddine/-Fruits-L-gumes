import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './LivreurDeliveries.css';

const LivreurDeliveries = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    date: ''
  });
  const [stats, setStats] = useState({
    scheduled: 0,
    inTransit: 0,
    deliveredToday: 0
  });

  useEffect(() => {
    fetchDeliveries();
    fetchStats();
  }, [filters]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status) {
        params.append('status', filters.status);
      }
      
      if (filters.date) {
        params.append('startDate', filters.date);
        params.append('endDate', filters.date);
      }

      const response = await api.get(`/deliveries?${params.toString()}`);
      
      if (response.data.success) {
        setDeliveries(response.data.deliveries || []);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      console.error('Erreur chargement livraisons:', error);
      toast.error('Erreur lors du chargement des livraisons');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/deliveries');
      if (response.data.success) {
        const allDeliveries = response.data.deliveries || [];
        const today = new Date().toISOString().split('T')[0];
        
        setStats({
          scheduled: allDeliveries.filter(d => d.status === 'SCHEDULED').length,
          inTransit: allDeliveries.filter(d => d.status === 'IN_TRANSIT').length,
          deliveredToday: allDeliveries.filter(d => 
            d.status === 'DELIVERED' && 
            new Date(d.deliveredAt).toISOString().split('T')[0] === today
          ).length
        });
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeliveryPriority = (delivery) => {
    if (!delivery.deliveryDate) return 'normal';
    const deliveryDate = new Date(delivery.deliveryDate);
    const now = new Date();
    const diffHours = (deliveryDate - now) / (1000 * 60 * 60);
    
    if (diffHours < 0) return 'urgent';
    if (diffHours <= 2) return 'high';
    return 'normal';
  };

  if (loading && deliveries.length === 0) {
    return <div className="loading">Chargement des livraisons...</div>;
  }

  return (
    <div className="livreur-deliveries">
      <h1>🚚 Mes Livraisons</h1>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-scheduled">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.scheduled}</div>
            <div className="stat-label">Planifiées</div>
          </div>
        </div>
        <div className="stat-card stat-transit">
          <div className="stat-icon">🚛</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inTransit}</div>
            <div className="stat-label">En transit</div>
          </div>
        </div>
        <div className="stat-card stat-delivered">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.deliveredToday}</div>
            <div className="stat-label">Livrées aujourd'hui</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-card">
        <h3>Filtres</h3>
        <div className="filters-grid">
          <div className="form-group">
            <label>Statut</label>
            <select 
              name="status" 
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">Tous les statuts</option>
              <option value="SCHEDULED">Planifiées</option>
              <option value="IN_TRANSIT">En transit</option>
              <option value="DELIVERED">Livrées</option>
              <option value="FAILED">Échouées</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              name="date" 
              value={filters.date}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      {/* Liste des livraisons */}
      <div className="deliveries-section">
        {deliveries.length === 0 ? (
          <div className="no-deliveries">
            <p>📭 Aucune livraison assignée</p>
          </div>
        ) : (
          <div className="deliveries-list">
            {deliveries.map((delivery) => {
              const priority = getDeliveryPriority(delivery);
              const order = delivery.order;
              
              return (
                <div 
                  key={delivery.id} 
                  className={`delivery-card priority-${priority}`}
                >
                  <div className="delivery-header">
                    <div className="delivery-info">
                      <h3>Livraison #{delivery.id.slice(0, 8)}</h3>
                      <p className="delivery-date">
                        Date prévue: {formatDate(delivery.deliveryDate)}
                      </p>
                      {delivery.timeSlot && (
                        <p className="time-slot">
                          Créneau: {delivery.timeSlot}
                        </p>
                      )}
                    </div>
                    <div className="delivery-status-badges">
                      <span className={`status-badge status-${delivery.status?.toLowerCase().replace('_', '-')}`}>
                        {delivery.status || 'SCHEDULED'}
                      </span>
                      {priority === 'urgent' && (
                        <span className="priority-badge urgent">🚨 URGENT</span>
                      )}
                      {priority === 'high' && (
                        <span className="priority-badge high">⚠️ PRIORITAIRE</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="delivery-details">
                    <div className="detail-section">
                      <h4>📍 Adresse de Livraison</h4>
                      <div className="address-info">
                        <p><strong>Magasin:</strong> {order?.shop?.name || 'N/A'}</p>
                        <p><strong>Adresse:</strong> {order?.shop?.address || 'N/A'}</p>
                        <p><strong>Ville:</strong> {order?.shop?.city || 'N/A'} {order?.shop?.postalCode || ''}</p>
                        {order?.shop?.phone && (
                          <p><strong>Téléphone:</strong> {order.shop.phone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="detail-section">
                      <h4>📦 Informations Commande</h4>
                      <div className="order-info">
                        <p><strong>Commande:</strong> #{order?.id?.slice(0, 8) || 'N/A'}</p>
                        <p><strong>Total TTC:</strong> {formatPrice(order?.totalTTC)}</p>
                        <p><strong>Articles:</strong> {order?.items?.length || 0} produit(s)</p>
                      </div>
                    </div>
                  </div>

                  {delivery.notes && (
                    <div className="delivery-notes">
                      <strong>Notes:</strong> {delivery.notes}
                    </div>
                  )}

                  <div className="delivery-actions">
                    {delivery.status === 'SCHEDULED' && (
                      <button
                        className="btn btn-start"
                        onClick={async () => {
                          try {
                            await api.put(`/deliveries/${delivery.id}`, { 
                              status: 'IN_TRANSIT' 
                            });
                            toast.success('Livraison démarrée');
                            fetchDeliveries();
                            fetchStats();
                          } catch (error) {
                            toast.error('Erreur lors du démarrage de la livraison');
                          }
                        }}
                      >
                        🚀 Démarrer la livraison
                      </button>
                    )}
                    
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/livreur/delivery/${delivery.id}`)}
                    >
                      📋 Voir les détails
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LivreurDeliveries;
