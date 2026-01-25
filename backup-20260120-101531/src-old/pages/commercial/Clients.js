import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './CommercialClients.css';

const CommercialClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    active: ''
  });

  useEffect(() => {
    fetchClients();
  }, [filters]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await api.get(`/shops?${params.toString()}`);
      
      if (response.data.success) {
        let clientsList = response.data.shops || [];
        
        // Filtrer par ville si nécessaire
        if (filters.city) {
          clientsList = clientsList.filter(client => 
            client.city?.toLowerCase().includes(filters.city.toLowerCase())
          );
        }
        
        // Filtrer par statut actif si nécessaire
        if (filters.active === 'active') {
          // On pourrait vérifier les commandes récentes
        }
        
        setClients(clientsList);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      toast.error('Erreur lors du chargement des clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDetails = async (shopId) => {
    try {
      const response = await api.get(`/shops/${shopId}`);
      if (response.data.success) {
        setSelectedClient(response.data.shop);
        
        // Récupérer les commandes du client
        const ordersResponse = await api.get(`/orders?shopId=${shopId}`);
        if (ordersResponse.data.success) {
          setSelectedClient(prev => ({
            ...prev,
            orders: ordersResponse.data.orders || []
          }));
        }
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price || 0);
  };

  const calculateTotalSales = (orders) => {
    if (!orders || orders.length === 0) return 0;
    return orders.reduce((sum, order) => sum + (order.totalTTC || 0), 0);
  };

  if (loading && clients.length === 0) {
    return <div className="loading">Chargement des clients...</div>;
  }

  return (
    <div className="commercial-clients">
      <h1>👥 Gestion des Clients</h1>

      {/* Filtres et recherche */}
      <div className="filters-card">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher un client (nom, ville, email)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                fetchClients();
              }
            }}
          />
          <button className="btn-search" onClick={fetchClients}>
            🔍 Rechercher
          </button>
        </div>
        <div className="filters-grid">
          <div className="form-group">
            <label>Ville</label>
            <input
              type="text"
              placeholder="Filtrer par ville..."
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="clients-section">
        {clients.length === 0 ? (
          <div className="no-clients">
            <p>📭 Aucun client trouvé</p>
          </div>
        ) : (
          <div className="clients-grid">
            {clients.map((client) => {
              const totalSales = calculateTotalSales(client.orders || []);
              const orderCount = client.orders?.length || 0;
              
              return (
                <div 
                  key={client.id} 
                  className="client-card"
                  onClick={() => fetchClientDetails(client.id)}
                >
                  <div className="client-header">
                    <h3>{client.name}</h3>
                    <span className="client-status active">Actif</span>
                  </div>
                  <div className="client-info">
                    <p><strong>📍</strong> {client.city || 'N/A'}</p>
                    <p><strong>📞</strong> {client.phone || 'N/A'}</p>
                    {client.user?.email && (
                      <p><strong>✉️</strong> {client.user.email}</p>
                    )}
                  </div>
                  <div className="client-stats">
                    <div className="stat-item">
                      <span className="stat-label">Commandes</span>
                      <span className="stat-value">{orderCount}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">CA Total</span>
                      <span className="stat-value">{formatPrice(totalSales)}</span>
                    </div>
                  </div>
                  <div className="client-actions">
                    <button
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchClientDetails(client.id);
                      }}
                    >
                      Voir détails
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/commercial/quotes?shopId=${client.id}`);
                      }}
                    >
                      Créer devis
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal détails client */}
      {selectedClient && (
        <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails Client - {selectedClient.name}</h2>
              <button className="btn-close" onClick={() => setSelectedClient(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="client-details">
                <h3>Informations</h3>
                <div className="details-grid">
                  <div><strong>Nom:</strong> {selectedClient.name}</div>
                  <div><strong>Adresse:</strong> {selectedClient.address || 'N/A'}</div>
                  <div><strong>Ville:</strong> {selectedClient.city || 'N/A'} {selectedClient.postalCode || ''}</div>
                  <div><strong>Téléphone:</strong> {selectedClient.phone || 'N/A'}</div>
                  {selectedClient.user && (
                    <>
                      <div><strong>Email:</strong> {selectedClient.user.email}</div>
                      <div><strong>Contact:</strong> {selectedClient.user.name}</div>
                    </>
                  )}
                </div>
              </div>
              
              {selectedClient.orders && (
                <div className="client-orders">
                  <h3>Historique des Commandes ({selectedClient.orders.length})</h3>
                  <div className="orders-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Commande</th>
                          <th>Statut</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedClient.orders.slice(0, 10).map((order) => (
                          <tr key={order.id}>
                            <td>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                            <td>#{order.id.slice(0, 8)}</td>
                            <td>
                              <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                                {order.status}
                              </span>
                            </td>
                            <td>{formatPrice(order.totalTTC)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommercialClients;
