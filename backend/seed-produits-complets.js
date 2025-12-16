/**
 * Script pour créer tous les produits fruits et légumes avec catégories
 * Usage: node seed-produits-complets.js
 * 
 * Pour télécharger les images automatiquement après:
 * node seed-produits-images.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fonction pour générer une URL d'image placeholder
const getPhotoUrl = (productName) => {
  // Les images seront téléchargées par seed-produits-images.js
  return null; // null pour l'instant, sera mis à jour par le script d'images
};

async function main() {
  console.log('🌱 Création de tous les produits fruits et légumes...\n');

  const produits = [
    // ============================================
    // FRUITS
    // ============================================
    { name: 'Pommes Golden', priceHT: 3.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Pommes Gala', priceHT: 3.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Pommes Granny Smith', priceHT: 3.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Pommes Pink Lady', priceHT: 4.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Pommes Fuji', priceHT: 3.60, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Pommes Reinette', priceHT: 3.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Pommes Braeburn', priceHT: 3.70, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    
    { name: 'Bananes', priceHT: 2.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Bananes plantain', priceHT: 3.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Bananes bio', priceHT: 3.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    
    { name: 'Oranges', priceHT: 2.70, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Oranges sanguines', priceHT: 3.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Oranges Navel', priceHT: 2.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Clémentines', priceHT: 3.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Mandarines', priceHT: 3.60, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Pamplemousses', priceHT: 3.40, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    
    { name: 'Citrons', priceHT: 3.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Citrons verts', priceHT: 4.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Citrons jaunes', priceHT: 3.60, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    
    { name: 'Fraises', priceHT: 5.90, tvaRate: 5.5, unit: 'caisse', category: 'FRUITS' },
    { name: 'Fraises Gariguette', priceHT: 6.50, tvaRate: 5.5, unit: 'caisse', category: 'FRUITS' },
    { name: 'Framboises', priceHT: 8.50, tvaRate: 5.5, unit: 'caisse', category: 'FRUITS' },
    { name: 'Myrtilles', priceHT: 7.80, tvaRate: 5.5, unit: 'caisse', category: 'FRUITS' },
    { name: 'Mûres', priceHT: 6.90, tvaRate: 5.5, unit: 'caisse', category: 'FRUITS' },
    { name: 'Groseilles', priceHT: 7.20, tvaRate: 5.5, unit: 'caisse', category: 'FRUITS' },
    { name: 'Cassis', priceHT: 8.20, tvaRate: 5.5, unit: 'caisse', category: 'FRUITS' },
    
    { name: 'Raisin blanc', priceHT: 4.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Raisin noir', priceHT: 4.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Raisin rouge', priceHT: 4.30, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Raisin Chasselas', priceHT: 4.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    
    { name: 'Pêches', priceHT: 4.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Pêches plates', priceHT: 5.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Nectarines', priceHT: 4.60, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Brugnons', priceHT: 4.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Abricots', priceHT: 5.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    
    { name: 'Poires', priceHT: 3.40, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Poires Williams', priceHT: 3.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Poires Conférence', priceHT: 3.60, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Poires Comice', priceHT: 3.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    
    { name: 'Kiwis', priceHT: 4.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Kiwis jaunes', priceHT: 5.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Ananas', priceHT: 3.20, tvaRate: 5.5, unit: 'piece', category: 'FRUITS' },
    { name: 'Mangues', priceHT: 5.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Avocats', priceHT: 4.80, tvaRate: 5.5, unit: 'piece', category: 'FRUITS' },
    { name: 'Avocats Hass', priceHT: 5.50, tvaRate: 5.5, unit: 'piece', category: 'FRUITS' },
    { name: 'Papayes', priceHT: 6.50, tvaRate: 5.5, unit: 'piece', category: 'FRUITS' },
    { name: 'Goyaves', priceHT: 7.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Litchis', priceHT: 8.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Ramboutans', priceHT: 9.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    
    { name: 'Melons', priceHT: 2.80, tvaRate: 5.5, unit: 'piece', category: 'FRUITS' },
    { name: 'Melons Charentais', priceHT: 3.20, tvaRate: 5.5, unit: 'piece', category: 'FRUITS' },
    { name: 'Pastèques', priceHT: 2.50, tvaRate: 5.5, unit: 'piece', category: 'FRUITS' },
    { name: 'Cantaloups', priceHT: 3.20, tvaRate: 5.5, unit: 'piece', category: 'FRUITS' },
    { name: 'Melons jaunes', priceHT: 3.00, tvaRate: 5.5, unit: 'piece', category: 'FRUITS' },
    
    { name: 'Cerises', priceHT: 8.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Cerises Burlat', priceHT: 9.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Prunes', priceHT: 4.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Reines-claudes', priceHT: 5.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Mirabelles', priceHT: 5.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    
    { name: 'Figues', priceHT: 6.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Figues violettes', priceHT: 7.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Dattes', priceHT: 9.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Grenades', priceHT: 5.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Kakis', priceHT: 4.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    { name: 'Coings', priceHT: 3.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS' },
    
    // ============================================
    // LÉGUMES
    // ============================================
    { name: 'Tomates', priceHT: 2.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Tomates cerises', priceHT: 4.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Tomates grappes', priceHT: 3.80, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Tomates anciennes', priceHT: 5.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Tomates cœur de bœuf', priceHT: 4.80, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Tomates Roma', priceHT: 3.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    
    { name: 'Carottes', priceHT: 1.80, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Carottes nouvelles', priceHT: 2.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Carottes bio', priceHT: 2.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    
    { name: 'Courgettes', priceHT: 2.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Courgettes rondes', priceHT: 3.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Courgettes jaunes', priceHT: 2.80, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    
    { name: 'Aubergines', priceHT: 3.80, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Aubergines longues', priceHT: 4.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Poivrons rouges', priceHT: 4.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Poivrons verts', priceHT: 4.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Poivrons jaunes', priceHT: 4.80, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Poivrons orange', priceHT: 4.90, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    
    { name: 'Concombres', priceHT: 2.30, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    { name: 'Concombres libanais', priceHT: 3.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Cornichons', priceHT: 5.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    
    { name: 'Salade verte', priceHT: 1.50, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    { name: 'Laitue', priceHT: 1.60, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    { name: 'Laitue romaine', priceHT: 1.80, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    { name: 'Roquette', priceHT: 4.50, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    { name: 'Mâche', priceHT: 3.80, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    { name: 'Épinards', priceHT: 3.20, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    { name: 'Épinards frais', priceHT: 3.50, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    { name: 'Cresson', priceHT: 2.90, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    { name: 'Frisée', priceHT: 1.70, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    { name: 'Scarole', priceHT: 1.80, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    
    { name: 'Chou', priceHT: 1.90, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    { name: 'Chou-fleur', priceHT: 2.80, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    { name: 'Brocoli', priceHT: 3.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Chou de Bruxelles', priceHT: 4.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Chou kale', priceHT: 3.80, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    { name: 'Chou rouge', priceHT: 2.20, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    { name: 'Chou blanc', priceHT: 1.90, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    { name: 'Chou-rave', priceHT: 2.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    
    { name: 'Oignons', priceHT: 1.60, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Oignons rouges', priceHT: 2.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Oignons jaunes', priceHT: 1.70, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Oignons nouveaux', priceHT: 3.20, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    { name: 'Échalotes', priceHT: 4.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Échalotes grises', priceHT: 5.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Ail', priceHT: 6.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Ail nouveau', priceHT: 7.20, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    
    { name: 'Pommes de terre', priceHT: 1.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Pommes de terre nouvelles', priceHT: 2.80, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Pommes de terre Charlotte', priceHT: 2.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Pommes de terre Bintje', priceHT: 1.60, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Patates douces', priceHT: 3.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    
    { name: 'Radis', priceHT: 2.50, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    { name: 'Radis roses', priceHT: 2.80, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    { name: 'Radis noirs', priceHT: 3.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Betteraves', priceHT: 2.80, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Betteraves rouges', priceHT: 3.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Navets', priceHT: 2.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Rutabagas', priceHT: 2.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    
    { name: 'Céleri', priceHT: 2.80, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    { name: 'Céleri-rave', priceHT: 3.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Fenouil', priceHT: 3.20, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    { name: 'Asperges', priceHT: 8.90, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    { name: 'Asperges vertes', priceHT: 9.50, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    { name: 'Asperges blanches', priceHT: 10.20, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    { name: 'Artichauts', priceHT: 4.50, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    { name: 'Poireaux', priceHT: 2.50, tvaRate: 5.5, unit: 'botte', category: 'LEGUMES' },
    
    { name: 'Champignons', priceHT: 5.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Champignons de Paris', priceHT: 5.80, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Pleurotes', priceHT: 7.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Girolles', priceHT: 18.90, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Cèpes', priceHT: 22.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Champignons shiitake', priceHT: 12.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    
    { name: 'Haricots verts', priceHT: 4.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Haricots blancs', priceHT: 3.80, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Haricots rouges', priceHT: 3.90, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Haricots coco', priceHT: 4.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Pois', priceHT: 4.80, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Petits pois', priceHT: 5.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Pois mange-tout', priceHT: 4.90, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Maïs', priceHT: 2.80, tvaRate: 5.5, unit: 'piece', category: 'LEGUMES' },
    
    { name: 'Courges', priceHT: 2.50, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Potiron', priceHT: 2.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Butternut', priceHT: 2.80, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Patidou', priceHT: 3.20, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    { name: 'Courge spaghetti', priceHT: 2.90, tvaRate: 5.5, unit: 'kg', category: 'LEGUMES' },
    
    // ============================================
    // HERBES AROMATIQUES
    // ============================================
    { name: 'Basilic', priceHT: 3.50, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Basilic pourpre', priceHT: 4.20, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Persil', priceHT: 2.50, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Persil plat', priceHT: 2.80, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Persil frisé', priceHT: 2.60, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Coriandre', priceHT: 3.20, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Ciboulette', priceHT: 2.90, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Thym', priceHT: 4.50, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Romarin', priceHT: 4.80, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Origan', priceHT: 4.20, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Menthe', priceHT: 3.80, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Menthe verte', priceHT: 3.90, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Aneth', priceHT: 3.50, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Estragon', priceHT: 4.20, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Sauge', priceHT: 4.50, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Laurier', priceHT: 5.20, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Cerfeuil', priceHT: 3.80, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    { name: 'Sarriette', priceHT: 4.20, tvaRate: 5.5, unit: 'botte', category: 'HERBES' },
    
    // ============================================
    // FRUITS SECS
    // ============================================
    { name: 'Amandes', priceHT: 12.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Amandes décortiquées', priceHT: 15.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Noix', priceHT: 9.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Noix décortiquées', priceHT: 14.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Noisettes', priceHT: 11.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Noisettes décortiquées', priceHT: 16.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Pistaches', priceHT: 18.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Pistaches décortiquées', priceHT: 24.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Cacahuètes', priceHT: 6.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Cacahuètes décortiquées', priceHT: 8.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Noix de cajou', priceHT: 16.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Noix de coco', priceHT: 4.50, tvaRate: 5.5, unit: 'piece', category: 'FRUITS_SECS' },
    { name: 'Noix de pécan', priceHT: 19.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Noix du Brésil', priceHT: 22.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Macadamia', priceHT: 28.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    
    { name: 'Raisins secs', priceHT: 7.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Raisins secs blonds', priceHT: 7.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Raisins secs noirs', priceHT: 8.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Abricots secs', priceHT: 9.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Figues séchées', priceHT: 9.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Dattes séchées', priceHT: 8.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Dattes Medjool', priceHT: 12.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Cranberries séchées', priceHT: 10.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Pruneaux', priceHT: 7.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Pruneaux d\'Agen', priceHT: 9.50, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Bananes séchées', priceHT: 8.90, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Mangues séchées', priceHT: 11.20, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
    { name: 'Ananas séché', priceHT: 9.80, tvaRate: 5.5, unit: 'kg', category: 'FRUITS_SECS' },
  ];

  console.log(`Création de ${produits.length} produits...\n`);

  let created = 0;
  let updated = 0;

  for (const produit of produits) {
    try {
      // Vérifier si le produit existe
      const existing = await prisma.product.findFirst({
        where: { name: produit.name }
      });

      if (existing) {
        // Mettre à jour le produit existant
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            ...produit,
            isActive: true,
            isVisibleToClients: true,
            stock: produit.stock || 0,
            stockAlert: produit.stockAlert || 10
          }
        });
        updated++;
        console.log(`   ✅ ${produit.name} (mis à jour)`);
      } else {
        // Créer un nouveau produit
        await prisma.product.create({
          data: {
            ...produit,
            isActive: true,
            isVisibleToClients: true,
            stock: produit.stock || 0,
            stockAlert: produit.stockAlert || 10,
            photoUrl: getPhotoUrl(produit.name)
          }
        });
        created++;
        console.log(`   ✅ ${produit.name} (créé)`);
      }
    } catch (error) {
      console.error(`   ❌ Erreur pour ${produit.name}:`, error.message);
    }
  }

  console.log(`\n============================================================`);
  console.log(`🎉 CRÉATION TERMINÉE!`);
  console.log(`============================================================`);
  console.log(`\n📊 Statistiques:`);
  console.log(`   - ${created} produits créés`);
  console.log(`   - ${updated} produits mis à jour`);
  console.log(`   - Total: ${produits.length} produits\n`);

  // Afficher les statistiques par catégorie
  const stats = await prisma.product.groupBy({
    by: ['category'],
    _count: {
      id: true
    }
  });

  console.log(`📦 Répartition par catégorie:`);
  stats.forEach(stat => {
    const categoryNames = {
      FRUITS: 'Fruits',
      LEGUMES: 'Légumes',
      HERBES: 'Herbes aromatiques',
      FRUITS_SECS: 'Fruits secs'
    };
    console.log(`   - ${categoryNames[stat.category]}: ${stat._count.id} produits`);
  });
  console.log('\n💡 Pour télécharger les images automatiquement:');
  console.log('   node seed-produits-images.js\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
