/**
 * Calcule le montant TTC à partir du HT et du taux de TVA
 */
const calculateTTC = (ht, tvaRate) => {
  return ht * (1 + tvaRate / 100);
};

/**
 * Calcule le montant TVA à partir du HT et du taux
 */
const calculateTVA = (ht, tvaRate) => {
  return ht * (tvaRate / 100);
};

/**
 * Calcule les totaux d'un item de commande
 */
const calculateOrderItemTotals = (quantity, priceHT, tvaRate) => {
  const totalHT = quantity * priceHT;
  const totalTVA = calculateTVA(totalHT, tvaRate);
  const totalTTC = calculateTTC(totalHT, tvaRate);

  return {
    totalHT: Math.round(totalHT * 100) / 100,
    totalTVA: Math.round(totalTVA * 100) / 100,
    totalTTC: Math.round(totalTTC * 100) / 100
  };
};

/**
 * Calcule les totaux d'une commande à partir de ses items
 */
const calculateOrderTotals = (items) => {
  const totals = items.reduce(
    (acc, item) => ({
      totalHT: acc.totalHT + item.totalHT,
      totalTVA: acc.totalTVA + item.totalTVA,
      totalTTC: acc.totalTTC + item.totalTTC
    }),
    { totalHT: 0, totalTVA: 0, totalTTC: 0 }
  );

  return {
    totalHT: Math.round(totals.totalHT * 100) / 100,
    totalTVA: Math.round(totals.totalTVA * 100) / 100,
    totalTTC: Math.round(totals.totalTTC * 100) / 100
  };
};

module.exports = {
  calculateTTC,
  calculateTVA,
  calculateOrderItemTotals,
  calculateOrderTotals
};

