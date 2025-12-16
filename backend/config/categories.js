/**
 * Configuration des catégories et sous-catégories de produits
 * Utilisé pour faciliter la navigation et l'organisation des produits
 */

const CATEGORIES_CONFIG = {
  FRUITS: {
    name: 'Fruits',
    icon: '🍎',
    color: '#FF6B6B',
    subCategories: {
      POMMES: { name: 'Pommes', icon: '🍎' },
      BANANES: { name: 'Bananes', icon: '🍌' },
      AGRUMES: { name: 'Agrumes', icon: '🍊' },
      BAIES: { name: 'Baies', icon: '🫐' },
      RAISIN: { name: 'Raisin', icon: '🍇' },
      FRUITS_A_NOYAU: { name: 'Fruits à noyau', icon: '🍑' },
      FRUITS_EXOTIQUES: { name: 'Fruits exotiques', icon: '🥭' },
      MELONS: { name: 'Melons', icon: '🍈' },
      FRUITS_ROUGES: { name: 'Fruits rouges', icon: '🍒' },
      AUTRES_FRUITS: { name: 'Autres fruits', icon: '🍐' }
    }
  },
  LEGUMES: {
    name: 'Légumes',
    icon: '🥬',
    color: '#51CF66',
    subCategories: {
      TOMATES: { name: 'Tomates', icon: '🍅' },
      RACINES: { name: 'Légumes racines', icon: '🥕' },
      COURGES: { name: 'Courges', icon: '🥒' },
      POIVRONS: { name: 'Poivrons', icon: '🫑' },
      SALADES: { name: 'Salades', icon: '🥗' },
      CHOUX: { name: 'Choux', icon: '🥬' },
      OIGNONS_AIL: { name: 'Oignons & Ail', icon: '🧄' },
      LEGUMES_FEUILLES: { name: 'Légumes feuilles', icon: '🥬' },
      LEGUMES_SECS: { name: 'Légumes secs', icon: '🫘' },
      AUTRES_LEGUMES: { name: 'Autres légumes', icon: '🌽' }
    }
  },
  HERBES: {
    name: 'Herbes aromatiques',
    icon: '🌿',
    color: '#4ECDC4',
    subCategories: {
      HERBES_FRAICHES: { name: 'Herbes fraîches', icon: '🌿' },
      HERBES_SECHEES: { name: 'Herbes séchées', icon: '🌾' },
      AUTRES_HERBES: { name: 'Autres herbes', icon: '🌱' }
    }
  },
  FRUITS_SECS: {
    name: 'Fruits secs',
    icon: '🥜',
    color: '#FFD93D',
    subCategories: {
      NOIX: { name: 'Noix', icon: '🥜' },
      AMANDES: { name: 'Amandes', icon: '🌰' },
      FRUITS_SECS: { name: 'Fruits secs', icon: '🍇' },
      GRAINES: { name: 'Graines', icon: '🌾' },
      AUTRES_FRUITS_SECS: { name: 'Autres', icon: '🥜' }
    }
  }
};

/**
 * Obtient la configuration d'une catégorie
 */
function getCategoryConfig(category) {
  return CATEGORIES_CONFIG[category] || null;
}

/**
 * Obtient toutes les sous-catégories d'une catégorie
 */
function getSubCategories(category) {
  const config = getCategoryConfig(category);
  return config ? config.subCategories : {};
}

/**
 * Détermine la sous-catégorie d'un produit basé sur son nom
 */
function detectSubCategory(productName, category) {
  const name = productName.toLowerCase();
  const subCategories = getSubCategories(category);
  
  // Mapping des mots-clés vers les sous-catégories
  const keywords = {
    FRUITS: {
      POMMES: ['pomme', 'pommes'],
      BANANES: ['banane', 'bananes'],
      AGRUMES: ['orange', 'oranges', 'citron', 'citrons', 'clémentine', 'clémentines', 'mandarine', 'mandarines', 'pamplemousse', 'pamplemousses'],
      BAIES: ['fraise', 'fraises', 'framboise', 'framboises', 'myrtille', 'myrtilles', 'mûre', 'mûres', 'groseille', 'groseilles', 'cassis'],
      RAISIN: ['raisin'],
      FRUITS_A_NOYAU: ['pêche', 'pêches', 'nectarine', 'nectarines', 'brugnon', 'brugnons', 'abricot', 'abricots', 'prune', 'prunes', 'cerise', 'cerises'],
      FRUITS_EXOTIQUES: ['ananas', 'mangue', 'mangues', 'avocat', 'avocats', 'papaye', 'papayes', 'goyave', 'goyaves', 'litchi', 'litchis', 'ramboutan', 'ramboutans'],
      MELONS: ['melon', 'melons', 'pastèque', 'pastèques', 'cantaloup', 'cantaloups'],
      FRUITS_ROUGES: ['cerise', 'cerises', 'fraise', 'fraises', 'framboise', 'framboises'],
      AUTRES_FRUITS: ['poire', 'poires', 'kiwi', 'kiwis', 'figue', 'figues', 'datte', 'dattes', 'grenade', 'grenades', 'kaki', 'kakis', 'coing', 'coings']
    },
    LEGUMES: {
      TOMATES: ['tomate', 'tomates'],
      RACINES: ['carotte', 'carottes', 'navet', 'navets', 'radis', 'radis', 'betterave', 'betteraves', 'panais', 'panais', 'patate douce', 'patates douces'],
      COURGES: ['courgette', 'courgettes', 'courge', 'courges', 'potiron', 'potirons', 'butternut', 'citrouille', 'citrouilles'],
      POIVRONS: ['poivron', 'poivrons'],
      SALADES: ['salade', 'salades', 'laitue', 'laitues', 'roquette', 'mâche', 'frisée', 'scarole', 'cresson'],
      CHOUX: ['chou', 'choux', 'chou-fleur', 'brocoli', 'chou de bruxelles', 'chou kale', 'chou rouge', 'chou blanc', 'chou-rave'],
      OIGNONS_AIL: ['oignon', 'oignons', 'ail', 'échalote', 'échalotes', 'ciboulette'],
      LEGUMES_FEUILLES: ['épinard', 'épinards', 'bette', 'bettes', 'blette', 'blettes'],
      LEGUMES_SECS: ['haricot', 'haricots', 'lentille', 'lentilles', 'pois chiche', 'pois chiches', 'fève', 'fèves'],
      AUTRES_LEGUMES: ['concombre', 'concombres', 'cornichon', 'cornichons', 'maïs', 'asperge', 'asperges', 'artichaut', 'artichauts', 'aubergine', 'aubergines']
    },
    HERBES: {
      HERBES_FRAICHES: ['basilic', 'persil', 'ciboulette', 'coriandre', 'menthe', 'thym', 'romarin', 'sauge', 'estragon', 'cerfeuil', 'aneth'],
      HERBES_SECHEES: ['thym séché', 'romarin séché', 'origan séché', 'basilic séché'],
      AUTRES_HERBES: []
    },
    FRUITS_SECS: {
      NOIX: ['noix', 'noisette', 'noisettes', 'cajou', 'cajous'],
      AMANDES: ['amande', 'amandes'],
      FRUITS_SECS: ['raisin sec', 'raisins secs', 'datte', 'dattes', 'figue séchée', 'figues séchées', 'abricot sec', 'abricots secs'],
      GRAINES: ['graine', 'graines', 'tournesol', 'courge', 'lin', 'sésame'],
      AUTRES_FRUITS_SECS: []
    }
  };
  
  const categoryKeywords = keywords[category] || {};
  
  for (const [subCat, words] of Object.entries(categoryKeywords)) {
    if (words.some(word => name.includes(word))) {
      return subCat;
    }
  }
  
  // Retourner la première sous-catégorie par défaut si aucune correspondance
  const defaultSubCat = Object.keys(subCategories)[0];
  return defaultSubCat || null;
}

module.exports = {
  CATEGORIES_CONFIG,
  getCategoryConfig,
  getSubCategories,
  detectSubCategory
};

