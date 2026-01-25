import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './RecurringOrders.css';

const RecurringOrders = () => {
  const [recurringOrders, setRecurringOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'WEEKLY',
    dayOfWeek: 1,
    dayOfMonth: 1,
    items: [{ productId: '', quantity: 1 }],
  });

  useEffect(() => {
    fetchRecurringOrders();
    fetchProducts();
  }, []);

  const fetchRecurringOrders = async () => {
    try {
      const response = await api.get('/recurring-orders');
      setRecurringOrders(response.data.recurringOrders || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation : vérifier qu'au moins un produit est sélectionné
    const validItems = formData.items.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    try {
      await api.post('/recurring-orders', {
        ...formData,
        items: validItems,
      });
      toast.success('Commande récurrente créée avec succès');
      setShowForm(false);
      setFormData({ name: '', frequency: 'WEEKLY', dayOfWeek: 1, dayOfMonth: 1, items: [{ productId: '', quantity: 1 }] });
      fetchRecurringOrders();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Erreur lors de la création';
      toast.error(errorMessage);
      console.error('Erreur création commande récurrente:', error.response?.data);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.put(`/recurring-orders/${id}`, { isActive: !isActive });
      toast.success('Commande récurrente modifiée');
      fetchRecurringOrders();
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette commande récurrente ?')) return;
    try {
      await api.delete(`/recurring-orders/${id}`);
      toast.success('Commande récurrente supprimée');
      fetchRecurringOrders();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleRunNow = async (id) => {
    try {
      await api.post(`/recurring-orders/${id}/run`);
      toast.success('Commande créée avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'exécution');
    }
  };

  const getFrequencyLabel = (frequency) => {
    const labels = { DAILY: 'Quotidienne', WEEKLY: 'Hebdomadaire', MONTHLY: 'Mensuelle', CUSTOM: 'Personnalisée' };
    return labels[frequency] || frequency;
  };

  return (
    <div className="recurring-orders">
      <div className="header">
        <h1>🔄 Commandes Récurrentes</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Nouvelle commande récurrente'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h2>Créer une commande récurrente</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nom de la commande</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Fréquence</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              >
                <option value="DAILY">Quotidienne</option>
                <option value="WEEKLY">Hebdomadaire</option>
                <option value="MONTHLY">Mensuelle</option>
              </select>
            </div>
            {formData.frequency === 'WEEKLY' && (
              <div className="form-group">
                <label>Jour de la semaine</label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                >
                  <option value="0">Dimanche</option>
                  <option value="1">Lundi</option>
                  <option value="2">Mardi</option>
                  <option value="3">Mercredi</option>
                  <option value="4">Jeudi</option>
                  <option value="5">Vendredi</option>
                  <option value="6">Samedi</option>
                </select>
              </div>
            )}
            {formData.frequency === 'MONTHLY' && (
              <div className="form-group">
                <label>Jour du mois (1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label>Produits *</label>
              <div className="products-list">
                {formData.items.map((item, index) => (
                  <div key={index} className="product-item">
                    <div>
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].productId = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                        required
                      >
                        <option value="">Sélectionner un produit</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {product.priceHT}€/{product.unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Quantité"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].quantity = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, items: newItems });
                        }}
                        required
                      />
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = formData.items.filter((_, i) => i !== index);
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="btn-remove-product"
                        title="Supprimer ce produit"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1 }] });
                }}
                className="btn-add-product"
              >
                + Ajouter un produit
              </button>
            </div>
            <button type="submit" className="btn btn-primary">Créer</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : recurringOrders.length === 0 ? (
        <div className="empty-state">Aucune commande récurrente</div>
      ) : (
        <div className="recurring-orders-list">
          {recurringOrders.map((order) => (
            <div key={order.id} className={`recurring-order-card ${!order.isActive ? 'inactive' : ''}`}>
              <div className="card-header">
                <h3>{order.name}</h3>
                <span className={`badge ${order.isActive ? 'active' : 'inactive'}`}>
                  {order.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="card-body">
                <p><strong>Fréquence:</strong> {getFrequencyLabel(order.frequency)}</p>
                <p><strong>Prochaine exécution:</strong> {format(new Date(order.nextRun), 'PP', { locale: fr })}</p>
                {order.lastRun && (
                  <p><strong>Dernière exécution:</strong> {format(new Date(order.lastRun), 'PP', { locale: fr })}</p>
                )}
                <p><strong>Produits:</strong> {order.items?.length || 0}</p>
              </div>
              <div className="card-actions">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleToggleActive(order.id, order.isActive)}
                >
                  {order.isActive ? 'Désactiver' : 'Activer'}
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => handleRunNow(order.id)}>
                  Exécuter maintenant
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(order.id)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurringOrders;
