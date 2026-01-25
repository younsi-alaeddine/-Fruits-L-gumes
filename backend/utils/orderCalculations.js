/**
 * Utilitaires de calcul pour les commandes professionnelles
 * Inclut : marges, poids, colis, PVC, etc.
 */

/**
 * Calcule la marge en pourcentage
 */
const calculateMarginPercent = (priceHT, cessionPrice) => {
  if (!cessionPrice || cessionPrice === 0) return 0;
  return ((priceHT - cessionPrice) / cessionPrice) * 100;
};

/**
 * Calcule la marge en euros
 */
const calculateMarginAmount = (priceHT, cessionPrice, quantity) => {
  if (!cessionPrice) return 0;
  return (priceHT - cessionPrice) * quantity;
};

/**
 * Calcule le poids total d'un produit (approximation basée sur l'unité)
 */
const calculateProductWeight = (product, quantity) => {
  // Estimation du poids par unité selon le type de conditionnement
  const weightPerUnit = {
    KG: 1, // 1 kg par unité
    UC: 5, // 5 kg par unité (unité de compte)
    BAR: 2, // 2 kg par barquette
    SAC: 3, // 3 kg par sac
    PCE: 0.2, // 200g par pièce
    FIL: 0.5, // 500g par filet
    BOTTE: 0.3, // 300g par botte
    CAISSE: 10 // 10 kg par caisse
  };

  const packaging = product.packaging || 'KG';
  const weightPerUnitValue = weightPerUnit[packaging] || 1;
  
  return quantity * weightPerUnitValue;
};

/**
 * Calcule le nombre de colis (approximation)
 */
const calculatePackages = (items) => {
  // Un colis = environ 20 kg
  const totalWeight = items.reduce((sum, item) => {
    return sum + calculateProductWeight(item.product, item.quantity);
  }, 0);
  
  return Math.ceil(totalWeight / 20);
};

/**
 * Calcule les indicateurs financiers complets d'une commande
 */
const calculateOrderFinancials = (order, items) => {
  let totalMargin = 0;
  let totalPromoRevenue = 0;
  let totalWeight = 0;
  let totalCessionPrice = 0;

  items.forEach(item => {
    const product = item.product;
    const quantity = item.quantity || item.quantityOrdered || 0;
    const quantityPromo = item.quantityPromo || 0;
    
    // Prix utilisé (T1 ou T2)
    const priceUsed = order.pricingType === 'T2' && product.priceHT_T2 
      ? product.priceHT_T2 
      : product.priceHT;

    // Marge
    if (product.cessionPrice) {
      const marginAmount = calculateMarginAmount(priceUsed, product.cessionPrice, quantity);
      totalMargin += marginAmount;
    }

    // CA promotionnel
    if (quantityPromo > 0) {
      const promoPrice = priceUsed * (1 - (product.margin || 0) / 100);
      totalPromoRevenue += promoPrice * quantityPromo;
    }

    // Poids
    totalWeight += calculateProductWeight(product, quantity);

    // Prix de cession total
    if (product.cessionPrice) {
      totalCessionPrice += product.cessionPrice * quantity;
    }
  });

  const totalPackages = calculatePackages(items);
  const totalMarginPercent = totalCessionPrice > 0 
    ? (totalMargin / totalCessionPrice) * 100 
    : 0;
  const promoRevenuePercent = order.totalTTC > 0 
    ? (totalPromoRevenue / order.totalTTC) * 100 
    : 0;

  return {
    totalPackages,
    totalWeight: Math.round(totalWeight * 100) / 100,
    totalMargin: Math.round(totalMargin * 100) / 100,
    totalMarginPercent: Math.round(totalMarginPercent * 100) / 100,
    promoRevenue: Math.round(totalPromoRevenue * 100) / 100,
    promoRevenuePercent: Math.round(promoRevenuePercent * 100) / 100
  };
};

/**
 * Calcule les indicateurs d'un item de commande
 */
const calculateOrderItemFinancials = (item, product, pricingType = 'T1') => {
  const quantity = item.quantity || 0;
  const quantityPromo = item.quantityPromo || 0;
  
  // Prix utilisé
  const priceHT = pricingType === 'T2' && product.priceHT_T2 
    ? product.priceHT_T2 
    : product.priceHT;

  // Marge
  const margin = product.cessionPrice 
    ? calculateMarginPercent(priceHT, product.cessionPrice)
    : product.margin || 0;
  
  const marginAmount = product.cessionPrice
    ? calculateMarginAmount(priceHT, product.cessionPrice, quantity)
    : (priceHT * (margin / 100)) * quantity;

  // Poids
  const weight = calculateProductWeight(product, quantity);

  return {
    priceHT,
    priceHT_T2: product.priceHT_T2,
    margin: Math.round(margin * 100) / 100,
    marginAmount: Math.round(marginAmount * 100) / 100,
    weight: Math.round(weight * 100) / 100,
    quantityPromo
  };
};

module.exports = {
  calculateMarginPercent,
  calculateMarginAmount,
  calculateProductWeight,
  calculatePackages,
  calculateOrderFinancials,
  calculateOrderItemFinancials
};
