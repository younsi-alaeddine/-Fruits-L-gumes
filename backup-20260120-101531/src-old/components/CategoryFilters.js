import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './CategoryFilters.css';

const CategoryFilters = ({ 
  selectedCategory, 
  selectedSubCategory, 
  onCategoryChange, 
  onSubCategoryChange,
  showSubCategories = true 
}) => {
  const [categoriesConfig, setCategoriesConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoriesConfig();
  }, []);

  const fetchCategoriesConfig = async () => {
    try {
      const response = await api.get('/products/categories');
      if (response.data.success) {
        setCategoriesConfig(response.data.categories);
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    if (!categoriesConfig || !categoriesConfig[category]) return category;
    return `${categoriesConfig[category].icon} ${categoriesConfig[category].name}`;
  };

  if (loading) {
    return <div className="category-filters-loading">Chargement des catégories...</div>;
  }

  const categories = categoriesConfig ? Object.keys(categoriesConfig) : [];
  const subCategories = selectedCategory !== 'TOUS' && categoriesConfig?.[selectedCategory]?.subCategories 
    ? Object.entries(categoriesConfig[selectedCategory].subCategories)
    : [];

  return (
    <div className="category-filters-wrapper">
      {/* Filtres par catégorie principale */}
      <div className="category-filters">
        <button
          onClick={() => {
            onCategoryChange('TOUS');
            if (onSubCategoryChange) onSubCategoryChange('TOUS');
          }}
          className={`category-filter-btn ${selectedCategory === 'TOUS' ? 'active' : ''}`}
        >
          Tous les produits
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => {
              onCategoryChange(category);
              if (onSubCategoryChange) onSubCategoryChange('TOUS');
            }}
            className={`category-filter-btn ${selectedCategory === category ? 'active' : ''}`}
            style={{
              backgroundColor: selectedCategory === category ? categoriesConfig[category]?.color : 'white',
              borderColor: categoriesConfig[category]?.color || '#e0e0e0'
            }}
          >
            {getCategoryLabel(category)}
          </button>
        ))}
      </div>

      {/* Filtres par sous-catégorie */}
      {showSubCategories && selectedCategory !== 'TOUS' && subCategories.length > 0 && (
        <div className="subcategory-filters">
          <button
            onClick={() => onSubCategoryChange('TOUS')}
            className={`subcategory-filter-btn ${selectedSubCategory === 'TOUS' ? 'active' : ''}`}
          >
            Toutes les sous-catégories
          </button>
          {subCategories.map(([key, subCat]) => (
            <button
              key={key}
              onClick={() => onSubCategoryChange(key)}
              className={`subcategory-filter-btn ${selectedSubCategory === key ? 'active' : ''}`}
            >
              {subCat.icon} {subCat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryFilters;

