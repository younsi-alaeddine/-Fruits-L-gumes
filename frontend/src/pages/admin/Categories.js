import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './AdminCategories.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    icon: '',
    color: '#51CF66',
    description: '',
    order: 0,
  });

  const [subCategoryForm, setSubCategoryForm] = useState({
    name: '',
    icon: '',
    description: '',
    order: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Erreur récupération catégories:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setSubCategoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      icon: '',
      color: '#51CF66',
      description: '',
      order: 0,
    });
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      icon: category.icon || '',
      color: category.color || '#51CF66',
      description: category.description || '',
      order: category.order || 0,
    });
    setShowCategoryForm(true);
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, categoryForm);
        toast.success('Catégorie modifiée avec succès');
      } else {
        await api.post('/categories', categoryForm);
        toast.success('Catégorie créée avec succès');
      }
      setShowCategoryForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${name}" ?`)) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      toast.success('Catégorie supprimée avec succès');
      fetchCategories();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleCreateSubCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setEditingSubCategory(null);
    setSubCategoryForm({
      name: '',
      icon: '',
      description: '',
      order: 0,
    });
    setShowSubCategoryForm(true);
  };

  const handleEditSubCategory = (subCategory, categoryId) => {
    setSelectedCategoryId(categoryId);
    setEditingSubCategory(subCategory);
    setSubCategoryForm({
      name: subCategory.name,
      icon: subCategory.icon || '',
      description: subCategory.description || '',
      order: subCategory.order || 0,
    });
    setShowSubCategoryForm(true);
  };

  const handleSubmitSubCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingSubCategory) {
        await api.put(`/categories/subcategories/${editingSubCategory.id}`, subCategoryForm);
        toast.success('Sous-catégorie modifiée avec succès');
      } else {
        await api.post(`/categories/${selectedCategoryId}/subcategories`, subCategoryForm);
        toast.success('Sous-catégorie créée avec succès');
      }
      setShowSubCategoryForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteSubCategory = async (id, name) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la sous-catégorie "${name}" ?`)) {
      return;
    }

    try {
      await api.delete(`/categories/subcategories/${id}`);
      toast.success('Sous-catégorie supprimée avec succès');
      fetchCategories();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="admin-categories">
      <div className="categories-header">
        <h1>📁 Gestion des Catégories</h1>
        <button className="btn-primary" onClick={handleCreateCategory}>
          + Nouvelle Catégorie
        </button>
      </div>

      {/* Formulaire de catégorie */}
      {showCategoryForm && (
        <div className="modal-overlay" onClick={() => setShowCategoryForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
            <form onSubmit={handleSubmitCategory}>
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  name="name"
                  value={categoryForm.name}
                  onChange={handleCategoryInputChange}
                  required
                  placeholder="Ex: Oignons & Pommes de terre"
                />
              </div>

              <div className="form-group">
                <label>Icône (emoji)</label>
                <input
                  type="text"
                  name="icon"
                  value={categoryForm.icon}
                  onChange={handleCategoryInputChange}
                  placeholder="Ex: 🧄"
                />
              </div>

              <div className="form-group">
                <label>Couleur</label>
                <input
                  type="color"
                  name="color"
                  value={categoryForm.color}
                  onChange={handleCategoryInputChange}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={categoryForm.description}
                  onChange={handleCategoryInputChange}
                  rows="3"
                  placeholder="Description de la catégorie..."
                />
              </div>

              <div className="form-group">
                <label>Ordre d'affichage</label>
                <input
                  type="number"
                  name="order"
                  value={categoryForm.order}
                  onChange={handleCategoryInputChange}
                  min="0"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCategoryForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {editingCategory ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire de sous-catégorie */}
      {showSubCategoryForm && (
        <div className="modal-overlay" onClick={() => setShowSubCategoryForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSubCategory ? 'Modifier la sous-catégorie' : 'Nouvelle sous-catégorie'}</h2>
            <form onSubmit={handleSubmitSubCategory}>
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  name="name"
                  value={subCategoryForm.name}
                  onChange={handleSubCategoryInputChange}
                  required
                  placeholder="Ex: Ail, Oignons, Pommes de terre..."
                />
              </div>

              <div className="form-group">
                <label>Icône (emoji)</label>
                <input
                  type="text"
                  name="icon"
                  value={subCategoryForm.icon}
                  onChange={handleSubCategoryInputChange}
                  placeholder="Ex: 🧄"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={subCategoryForm.description}
                  onChange={handleSubCategoryInputChange}
                  rows="3"
                  placeholder="Description de la sous-catégorie..."
                />
              </div>

              <div className="form-group">
                <label>Ordre d'affichage</label>
                <input
                  type="number"
                  name="order"
                  value={subCategoryForm.order}
                  onChange={handleSubCategoryInputChange}
                  min="0"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowSubCategoryForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {editingSubCategory ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des catégories */}
      <div className="categories-list">
        {categories.length === 0 ? (
          <div className="empty-state">
            <p>Aucune catégorie créée. Créez votre première catégorie !</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="category-card">
              <div className="category-header">
                <div className="category-info">
                  <span className="category-icon" style={{ color: category.color || '#51CF66' }}>
                    {category.icon || '📁'}
                  </span>
                  <div>
                    <h3>{category.name}</h3>
                    {category.description && (
                      <p className="category-description">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="category-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleEditCategory(category)}
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Sous-catégories */}
              <div className="subcategories-section">
                <div className="subcategories-header">
                  <h4>Sous-catégories</h4>
                  <button
                    className="btn-small"
                    onClick={() => handleCreateSubCategory(category.id)}
                  >
                    + Ajouter
                  </button>
                </div>

                {category.subCategories && category.subCategories.length > 0 ? (
                  <div className="subcategories-list">
                    {category.subCategories.map((subCategory) => (
                      <div key={subCategory.id} className="subcategory-item">
                        <span className="subcategory-icon">{subCategory.icon || '📌'}</span>
                        <span className="subcategory-name">{subCategory.name}</span>
                        <div className="subcategory-actions">
                          <button
                            className="btn-icon-small"
                            onClick={() => handleEditSubCategory(subCategory, category.id)}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon-small btn-danger"
                            onClick={() => handleDeleteSubCategory(subCategory.id, subCategory.name)}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-subcategories">Aucune sous-catégorie</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
