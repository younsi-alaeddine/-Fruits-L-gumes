import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import './ClientOrders.css';

const ClientOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'upcoming'; // upcoming | history
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Mettre à jour searchTerm depuis l'URL
    const urlSearch = searchParams.get('search') || '';
    setSearchTerm(urlSearch);
  }, [searchParams]);

  useEffect(() => {
    // Filtrer et trier les commandes
    let filtered = [...orders];

    // Vue: livraisons à venir vs historique
    const upcomingStatuses = ['NEW', 'PREPARATION', 'LIVRAISON'];
    const historyStatuses = ['LIVREE', 'ANNULEE'];
    if (tab === 'history') {
      filtered = filtered.filter(order => historyStatuses.includes(order.status));
    } else {
      filtered = filtered.filter(order => upcomingStatuses.includes(order.status));
    }

    // Filtre par statut
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtre par recherche (date, montant, nombre de produits)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const date = new Date(order.createdAt);
        const dateStr = date.toLocaleDateString('fr-FR').toLowerCase();
        const totalStr = formatPrice(order.totalTTC).toLowerCase();
        const productCount = order.items.length.toString();
        return (
          dateStr.includes(searchLower) ||
          totalStr.includes(searchLower) ||
          productCount.includes(searchLower) ||
          order.id.toLowerCase().includes(searchLower)
        );
      });
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'amount-desc':
          return b.totalTTC - a.totalTTC;
        case 'amount-asc':
          return a.totalTTC - b.totalTTC;
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm, sortBy, tab]);

  // Si on change de tab, éviter un statut incompatible
  useEffect(() => {
    const upcomingStatuses = ['NEW', 'PREPARATION', 'LIVRAISON'];
    const historyStatuses = ['LIVREE', 'ANNULEE'];
    if (!statusFilter) return;
    const allowed = tab === 'history' ? historyStatuses : upcomingStatuses;
    if (!allowed.includes(statusFilter)) setStatusFilter('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      // Gérer la nouvelle structure paginée ou l'ancienne structure
      let orders = [];
      if (response.data.success && response.data.orders) {
        orders = response.data.orders;
      } else if (response.data.orders) {
        orders = response.data.orders;
      }
      setOrders(orders);
    } catch (error) {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const nextParams = new URLSearchParams(searchParams);
    if (value.trim()) nextParams.set('search', value);
    else nextParams.delete('search');
    setSearchParams(nextParams);
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setSelectedOrder(response.data.order);
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
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

  // Calculer les statistiques
  const stats = {
    totalOrders: orders.length,
    totalAmount: orders.reduce((sum, o) => sum + o.totalTTC, 0),
    pendingOrders: orders.filter(o => ['NEW', 'PREPARATION', 'LIVRAISON'].includes(o.status)).length,
    deliveredOrders: orders.filter(o => o.status === 'LIVREE').length
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
    const fileName = `Facture_${order.id.substring(0, 8)}.pdf`;
    doc.save(fileName);
    toast.success('Facture générée avec succès');
  };

  if (loading) {
    return <div className="loading">Chargement des commandes...</div>;
  }

  return (
    <div className="client-orders">
      <h1>{tab === 'history' ? 'Historique' : 'Livraisons à venir'}</h1>

      {/* Statistiques */}
      {orders.length > 0 && (
        <div className="orders-stats">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalOrders}</div>
              <div className="stat-label">Total commandes</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">{formatPrice(stats.totalAmount)}</div>
              <div className="stat-label">Montant total</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.pendingOrders}</div>
              <div className="stat-label">En cours</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.deliveredOrders}</div>
              <div className="stat-label">Livrées</div>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>Aucune commande pour le moment.</p>
        </div>
      ) : (
        <>
          {/* Filtres et recherche */}
          <div className="orders-filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Rechercher par date, montant, nombre de produits..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
            <div className="filters-row">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">Tous les statuts</option>
                {tab !== 'history' ? (
                  <>
                    <option value="NEW">Nouvelle</option>
                    <option value="PREPARATION">En préparation</option>
                    <option value="LIVRAISON">En livraison</option>
                  </>
                ) : (
                  <>
                    <option value="LIVREE">Livrée</option>
                    <option value="ANNULEE">Annulée</option>
                  </>
                )}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="date-desc">Date (récent)</option>
                <option value="date-asc">Date (ancien)</option>
                <option value="amount-desc">Montant (décroissant)</option>
                <option value="amount-asc">Montant (croissant)</option>
              </select>
            </div>
          </div>

          {/* Résumé */}
          <div className="orders-summary">
            <span>
              {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''} 
              {searchTerm || statusFilter ? ` (sur ${orders.length})` : ''}
            </span>
            <span className="summary-total">
              Total : {formatPrice(filteredOrders.reduce((sum, o) => sum + o.totalTTC, 0))}
            </span>
          </div>

          <div className="orders-table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Produits</th>
                  <th>Total TTC</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      {searchTerm || statusFilter ? 'Aucune commande trouvée' : 'Aucune commande'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{order.items.length} produit{order.items.length > 1 ? 's' : ''}</td>
                      <td className="price-cell">{formatPrice(order.totalTTC)}</td>
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
                            Détails
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
                            className="btn btn-success btn-sm"
                            title="Télécharger la facture PDF"
                          >
                            📄 PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
                  <div className="order-info-section">
                    <h3>📦 Informations de commande</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <strong>Numéro de commande :</strong>
                        <span>{selectedOrder.id.substring(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="info-item">
                        <strong>Date de commande :</strong>
                        <span>{formatDate(selectedOrder.createdAt)}</span>
                      </div>
                      {selectedOrder.deliveryDate && (
                        <div className="info-item">
                          <strong>Date de livraison prévue :</strong>
                          <span>{formatDate(selectedOrder.deliveryDate)}</span>
                        </div>
                      )}
                      <div className="info-item">
                        <strong>Statut :</strong>
                        <span className={`status-badge ${getStatusClass(selectedOrder.status)}`}>
                          {getStatusLabel(selectedOrder.status)}
                        </span>
                      </div>
                      {selectedOrder.paymentStatus && (
                        <div className="info-item">
                          <strong>Statut paiement :</strong>
                          <span className={`status-badge ${
                            selectedOrder.paymentStatus === 'PAYE' ? 'status-paid' :
                            selectedOrder.paymentStatus === 'IMPAYE' ? 'status-unpaid' :
                            'status-waiting'
                          }`}>
                            {selectedOrder.paymentStatus === 'PAYE' && 'Payé'}
                            {selectedOrder.paymentStatus === 'IMPAYE' && 'Impayé'}
                            {selectedOrder.paymentStatus === 'EN_ATTENTE' && 'En attente'}
                          </span>
                        </div>
                      )}
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
                              <td>{payment.paymentDate ? formatDate(payment.paymentDate) : '—'}</td>
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
                    </div>
                  )}

                  <div className="order-info-section">
                    <h3>🛒 Détail des produits</h3>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Produit</th>
                          <th>Quantité</th>
                          <th>Prix HT</th>
                          <th>Total HT</th>
                          <th>Total TTC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map(item => (
                          <tr key={item.id}>
                            <td><strong>{item.product.name}</strong></td>
                            <td>{item.quantity} {item.product.unit}</td>
                            <td>{formatPrice(item.priceHT)}</td>
                            <td>{formatPrice(item.totalHT)}</td>
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

                  <div className="order-actions">
                    <button
                      onClick={() => generateInvoicePDF(selectedOrder)}
                      className="btn btn-success"
                    >
                      📄 Télécharger la facture PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientOrders;

