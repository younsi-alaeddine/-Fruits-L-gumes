import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { getServerBaseURL } from '../../services/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import './AdminOrders.css';

const AdminOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState({
    shopId: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchShops();
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.shopId, filters.status, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchOrders(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    // Mettre à jour searchTerm depuis l'URL
    const urlSearch = searchParams.get('search') || '';
    setSearchTerm(urlSearch);
  }, [searchParams]);

  useEffect(() => {
    // Filtrer les commandes localement selon le terme de recherche
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => {
        const searchLower = searchTerm.toLowerCase();
        return (
          order.shop.name.toLowerCase().includes(searchLower) ||
          order.shop.city.toLowerCase().includes(searchLower) ||
          order.id.toLowerCase().includes(searchLower) ||
          order.status.toLowerCase().includes(searchLower) ||
          order.items.some(item => item.product.name.toLowerCase().includes(searchLower))
        );
      });
      setFilteredOrders(filtered);
    }
  }, [orders, searchTerm]);

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops');
      setShops(response.data.shops);
    } catch (error) {
      console.error('Erreur chargement magasins:', error);
    }
  };

  const fetchOrders = async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', itemsPerPage);
      if (filters.shopId) params.append('shopId', filters.shopId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/orders?${params.toString()}`);
      
      if (response.data.success && response.data.orders) {
        setOrders(response.data.orders);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else if (response.data.orders) {
        setOrders(response.data.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      // Ne pas afficher plusieurs fois la même erreur
      const errorMessage = error.response?.data?.message || 'Erreur lors du chargement des commandes';
      toast.error(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Mettre à jour l'URL sans recharger la page
    if (value.trim()) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setSelectedOrder(response.data.order);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Statut modifié avec succès');
      fetchOrders(currentPage);
      if (selectedOrder && selectedOrder.id === orderId) {
        fetchOrderDetails(orderId);
      }
    } catch (error) {
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateInvoicePDF = (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(40, 167, 69);
    doc.text('FACTURE', pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Fruits & Légumes Distribution', margin, yPos);
    yPos += 5;
    doc.setFontSize(10);
    doc.text('Distributeur de fruits et légumes', margin, yPos);
    yPos += 15;

    // Informations commande
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Commande N° ' + order.id.substring(0, 8).toUpperCase(), margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const orderDate = formatDate(order.createdAt);
    doc.text('Date : ' + orderDate, margin, yPos);
    yPos += 6;

    // Informations client
    doc.setFont(undefined, 'bold');
    doc.text('Client :', margin, yPos);
    yPos += 6;
    doc.setFont(undefined, 'normal');
    doc.text(order.shop.name, margin + 5, yPos);
    yPos += 5;
    doc.text(order.shop.address, margin + 5, yPos);
    yPos += 5;
    doc.text(order.shop.postalCode + ' ' + order.shop.city, margin + 5, yPos);
    if (order.shop.phone) {
      yPos += 5;
      doc.text('Tél : ' + order.shop.phone, margin + 5, yPos);
    }
    yPos += 15;

    // Tableau produits
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Détail des produits', margin, yPos);
    yPos += 8;

    // En-têtes tableau
    doc.setFillColor(40, 167, 69);
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Produit', margin + 2, yPos);
    doc.text('Qté', margin + 80, yPos);
    doc.text('Prix HT', margin + 110, yPos);
    doc.text('Total TTC', margin + 150, yPos);
    yPos += 8;

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

    // Produits
    order.items.forEach(item => {
      if (yPos > 250) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(item.product.name.substring(0, 30), margin + 2, yPos);
      doc.text(item.quantity + ' ' + item.product.unit, margin + 80, yPos);
      doc.text(formatPrice(item.priceHT).replace('€', '') + ' €', margin + 110, yPos);
      doc.text(formatPrice(item.totalTTC).replace('€', '') + ' €', margin + 150, yPos);
      yPos += 6;
    });

    yPos += 5;

    // Totaux
    if (yPos > 240) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.text('Total HT :', pageWidth - margin - 50, yPos, { align: 'right' });
    doc.text(formatPrice(order.totalHT), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    doc.setFont(undefined, 'normal');
    doc.text('TVA :', pageWidth - margin - 50, yPos, { align: 'right' });
    doc.text(formatPrice(order.totalTVA), pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(40, 167, 69);
    doc.text('Total TTC :', pageWidth - margin - 50, yPos, { align: 'right' });
    doc.text(formatPrice(order.totalTTC), pageWidth - margin, yPos, { align: 'right' });

    // Pied de page
    yPos = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Merci de votre confiance !', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text('Facture générée le ' + new Date().toLocaleDateString('fr-FR'), pageWidth / 2, yPos, { align: 'center' });

    // Sauvegarder
    const fileName = `Facture_${order.shop.name.replace(/\s+/g, '_')}_${order.id.substring(0, 8)}.pdf`;
    doc.save(fileName);
    toast.success('Facture générée avec succès');
  };

  const exportToExcel = async () => {
    try {
      if (filteredOrders.length === 0) {
        toast.warning('Aucune commande à exporter');
        return;
      }

      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (filters.shopId) params.append('shopId', filters.shopId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('format', 'excel');

      const response = await api.get(`/admin/export/orders?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `commandes_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Export Excel réussi');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
  };

  const exportToCSV = async () => {
    if (filteredOrders.length === 0) {
      toast.warning('Aucune commande à exporter');
      return;
    }

    // En-têtes CSV
    const headers = ['Date', 'Magasin', 'Ville', 'Produits', 'Total HT', 'Total TVA', 'Total TTC', 'Statut'];
    
    // Données CSV
    const csvData = filteredOrders.map(order => [
      formatDate(order.createdAt),
      order.shop.name,
      order.shop.city,
      order.items.length,
      formatPrice(order.totalHT).replace('€', '').trim(),
      formatPrice(order.totalTVA).replace('€', '').trim(),
      formatPrice(order.totalTTC).replace('€', '').trim(),
      getStatusLabel(order.status)
    ]);

    // Créer le contenu CSV
    const csvContent = [
      headers.join(';'),
      ...csvData.map(row => row.join(';'))
    ].join('\n');

    // Ajouter BOM pour Excel UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export CSV réussi');
  };

  const getStatusLabel = (status) => {
    const labels = {
      NEW: 'Nouvelle',
      PREPARATION: 'En préparation',
      LIVRAISON: 'En livraison',
      LIVREE: 'Livrée',
      ANNULEE: 'Annulée'
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      NEW: 'status-new',
      PREPARATION: 'status-preparation',
      LIVRAISON: 'status-livraison',
      LIVREE: 'status-livree',
      ANNULEE: 'status-annulee'
    };
    return classes[status] || '';
  };

  if (loading) {
    return <div className="loading">Chargement des commandes...</div>;
  }

  return (
    <div className="admin-orders">
      <h1>Gestion des Commandes</h1>

      <div className="filters-card">
        <h3>Filtres</h3>
        <div className="search-bar" style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Rechercher par magasin, ville, statut, produit..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '6px' }}
          />
        </div>
        <div className="filters-grid">
          <div className="form-group">
            <label>Client</label>
            <select
              value={filters.shopId}
              onChange={(e) => setFilters({ ...filters, shopId: e.target.value })}
            >
              <option value="">Tous les clients</option>
              {shops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Tous les statuts</option>
              <option value="NEW">Nouvelle</option>
              <option value="PREPARATION">En préparation</option>
              <option value="LIVRAISON">En livraison</option>
              <option value="LIVREE">Livrée</option>
              <option value="ANNULEE">Annulée</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date début</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Date fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="orders-summary">
        <div className="summary-item">
          <span className="summary-label">Total commandes :</span>
          <span className="summary-value">{filteredOrders.length}</span>
          {searchTerm && filteredOrders.length !== orders.length && (
            <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
              (sur {orders.length})
            </span>
          )}
          {!searchTerm && (
            <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
              (sur {pagination.total} au total)
            </span>
          )}
        </div>
        <div className="summary-item">
          <span className="summary-label">Total TTC :</span>
          <span className="summary-value">{formatPrice(filteredOrders.reduce((sum, o) => sum + o.totalTTC, 0))}</span>
        </div>
        <div className="summary-actions">
          <button
            onClick={exportToCSV}
            className="btn btn-success"
            disabled={filteredOrders.length === 0}
          >
            📥 Exporter CSV
          </button>
        </div>
      </div>

      <div className="orders-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Magasin</th>
              <th>Date</th>
              <th>Produits</th>
              <th>Total (€)</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  {searchTerm ? 'Aucune commande trouvée pour cette recherche' : 'Aucune commande'}
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id} className={`order-row status-${order.status.toLowerCase()}`}>
                  <td>
                    <div>
                      <strong>{order.shop.name}</strong>
                      <div className="shop-city">{order.shop.city}</div>
                    </div>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.items.length} produit{order.items.length > 1 ? 's' : ''}</td>
                  <td className="price-cell"><strong>{formatPrice(order.totalTTC)}</strong></td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => fetchOrderDetails(order.id)}
                        className="btn btn-primary btn-sm"
                      >
                        Voir
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const response = await api.get(`/orders/${order.id}`);
                            generateInvoicePDF(response.data.order);
                          } catch (error) {
                            toast.error('Erreur lors du chargement de la commande');
                          }
                        }}
                        className="btn btn-info btn-sm"
                        title="Générer facture PDF"
                      >
                        📄
                      </button>
                      {order.status === 'NEW' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(order.id, 'PREPARATION')}
                            className="btn btn-success btn-sm"
                            title="Accepter"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.id, 'ANNULEE')}
                            className="btn btn-danger btn-sm"
                            title="Refuser"
                          >
                            ✗
                          </button>
                        </>
                      )}
                      {order.status === 'PREPARATION' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'LIVRAISON')}
                          className="btn btn-info btn-sm"
                          title="Marquer en livraison"
                        >
                          🚚
                        </button>
                      )}
                      {order.status === 'LIVRAISON' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'LIVREE')}
                          className="btn btn-success btn-sm"
                          title="Marquer comme livrée"
                        >
                          ✓ Livrée
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
      {!searchTerm && pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => {
              const newPage = currentPage - 1;
              setCurrentPage(newPage);
            }}
            disabled={!pagination.hasPrevPage}
            className="pagination-btn"
          >
            Précédent
          </button>
          <div className="pagination-info">
            Page {currentPage} sur {pagination.totalPages} ({pagination.total} commandes)
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
            onClick={() => {
              const newPage = currentPage + 1;
              setCurrentPage(newPage);
            }}
            disabled={!pagination.hasNextPage}
            className="pagination-btn"
          >
            Suivant
          </button>
        </div>
      )}

      {selectedOrder && (
        <div className="order-details-modal" onClick={() => setSelectedOrder(null)}>
          <div className="order-details-content" onClick={(e) => e.stopPropagation()}>
            <div className="order-details-header">
              <h2>Détails de la commande</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-close"
              >
                ×
              </button>
            </div>
            <div className="order-details-body">
              {/* Informations magasin */}
              <div className="order-info-section">
                <h3>📦 Informations magasin</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Nom du magasin :</strong>
                    <span>{selectedOrder.shop.name}</span>
                  </div>
                  <div className="info-item">
                    <strong>Téléphone :</strong>
                    <span>{selectedOrder.shop.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="info-item full-width">
                    <strong>Adresse :</strong>
                    <span>{selectedOrder.shop.address}, {selectedOrder.shop.postalCode} {selectedOrder.shop.city}</span>
                  </div>
                  <div className="info-item">
                    <strong>Date de commande :</strong>
                    <span>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <strong>Statut :</strong>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                      className={`status-select ${getStatusClass(selectedOrder.status)}`}
                    >
                      <option value="NEW">Nouvelle</option>
                      <option value="PREPARATION">En préparation</option>
                      <option value="LIVRAISON">En livraison</option>
                      <option value="LIVREE">Livrée</option>
                      <option value="ANNULEE">Annulée</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Paiements */}
              {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                <div className="order-info-section">
                  <h3>💳 Paiements</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Montant</th>
                        <th>Méthode</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.payments.map(payment => (
                        <tr key={payment.id}>
                          <td>{formatDate(payment.paymentDate)}</td>
                          <td className="price-cell">{formatPrice(payment.amount)}</td>
                          <td>
                            {payment.paymentMethod === 'CASH' && '💵 Espèces'}
                            {payment.paymentMethod === 'CARD' && '💳 Carte'}
                            {payment.paymentMethod === 'TRANSFER' && '🏦 Virement'}
                            {payment.paymentMethod === 'CHECK' && '📝 Chèque'}
                            {!payment.paymentMethod && '—'}
                          </td>
                          <td>
                            <span className={`status-badge ${
                              payment.status === 'PAYE' ? 'status-paid' :
                              payment.status === 'IMPAYE' ? 'status-unpaid' :
                              payment.status === 'REMBOURSE' ? 'status-refunded' :
                              'status-waiting'
                            }`}>
                              {payment.status === 'PAYE' && 'Payé'}
                              {payment.status === 'IMPAYE' && 'Impayé'}
                              {payment.status === 'REMBOURSE' && 'Remboursé'}
                              {payment.status === 'EN_ATTENTE' && 'En attente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="payment-summary">
                    <p>
                      <strong>Total payé :</strong>{' '}
                      <span className="success">
                        {formatPrice(
                          selectedOrder.payments
                            .filter(p => p.status === 'PAYE')
                            .reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </span>
                      {' / '}
                      <strong>Total commande :</strong> {formatPrice(selectedOrder.totalTTC)}
                    </p>
                    <p>
                      <strong>Statut paiement :</strong>{' '}
                      <span className={`status-badge ${
                        selectedOrder.paymentStatus === 'PAYE' ? 'status-paid' :
                        selectedOrder.paymentStatus === 'IMPAYE' ? 'status-unpaid' :
                        'status-waiting'
                      }`}>
                        {selectedOrder.paymentStatus === 'PAYE' && 'Payé'}
                        {selectedOrder.paymentStatus === 'IMPAYE' && 'Impayé'}
                        {selectedOrder.paymentStatus === 'EN_ATTENTE' && 'En attente'}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Actions rapides */}
              <div className="quick-actions">
                {selectedOrder.status === 'NEW' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'PREPARATION')}
                      className="btn btn-success"
                    >
                      ✓ Accepter
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'ANNULEE')}
                      className="btn btn-danger"
                    >
                      ✗ Refuser
                    </button>
                  </>
                )}
                {selectedOrder.status === 'PREPARATION' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'LIVRAISON')}
                    className="btn btn-info"
                  >
                    🚚 Marquer en livraison
                  </button>
                )}
                {selectedOrder.status === 'LIVRAISON' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'LIVREE')}
                    className="btn btn-success"
                  >
                    ✅ Marquer comme livrée
                  </button>
                )}
                <button
                  onClick={() => generateInvoicePDF(selectedOrder)}
                  className="btn btn-primary"
                >
                  📄 Générer facture PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                >
                  🖨️ Imprimer bon de préparation
                </button>
              </div>

              {/* Détail produits commandés */}
              <div className="order-products-section">
                <h3>🛒 Détail produits commandés</h3>
                <table className="table products-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Photo</th>
                      <th>Qté</th>
                      <th>Prix HT</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.product.name}</strong></td>
                        <td>
                          {item.product.photoUrl ? (
                            <img
                              src={`${getServerBaseURL()}${item.product.photoUrl}`}
                              alt={item.product.name}
                              className="product-photo-small"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<span>🖼️</span>';
                              }}
                            />
                          ) : (
                            <span>🖼️</span>
                          )}
                        </td>
                        <td>{item.quantity} {item.product.unit}</td>
                        <td>{formatPrice(item.priceHT)}</td>
                        <td><strong>{formatPrice(item.totalTTC)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="order-totals">
                <div className="total-row">
                  <span>Total HT :</span>
                  <span>{formatPrice(selectedOrder.totalHT)}</span>
                </div>
                <div className="total-row">
                  <span>Total TVA :</span>
                  <span>{formatPrice(selectedOrder.totalTVA)}</span>
                </div>
                <div className="total-row total-final">
                  <span>Total TTC :</span>
                  <span>{formatPrice(selectedOrder.totalTTC)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;

