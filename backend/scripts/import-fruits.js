const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script d'import des fruits avec leurs catégories et sous-catégories
 * Basé sur la liste fournie par l'utilisateur
 */

// Structure des catégories et produits
const categoriesData = [
  {
    name: 'Agrumes',
    icon: '🍊',
    color: '#FF9500',
    description: 'Citrons, oranges, clémentines, pomelos',
    order: 1,
    subCategories: [
      { name: 'Citrons', icon: '🍋', order: 1 },
      { name: 'Clémentines', icon: '🍊', order: 2 },
      { name: 'Oranges', icon: '🍊', order: 3 },
      { name: 'Pomelos', icon: '🍊', order: 4 },
    ],
    products: [
      // Citrons
      { name: 'Citron jaune', unit: 'kg', priceHT: 3.50 },
      { name: 'Citron jaune filet', unit: 'kg', priceHT: 3.50 },
      { name: 'Citron vert', unit: 'kg', priceHT: 3.50 },
      
      // Clémentines
      { name: 'Clémentine Extra', unit: 'kg', priceHT: 2.80 },
      { name: 'Clémentine Feuille', unit: 'kg', priceHT: 2.80 },
      { name: 'Clémentine Soculente', unit: 'kg', priceHT: 2.80 },
      { name: 'Clémentine Orri', unit: 'kg', priceHT: 2.80 },
      { name: 'Clémenmiel Feuil', unit: 'kg', priceHT: 2.80 },
      { name: 'Clémenvilla', unit: 'kg', priceHT: 2.80 },
      
      // Oranges
      { name: 'Orange flt bouche', unit: 'kg', priceHT: 2.50 },
      { name: 'Orange flt jus', unit: 'kg', priceHT: 2.20 },
      { name: 'Orange machine', unit: 'kg', priceHT: 2.20 },
      { name: 'Orange Feuille', unit: 'kg', priceHT: 2.50 },
      { name: 'Orange plateau', unit: 'kg', priceHT: 2.50 },
      { name: 'Orange Soculente', unit: 'kg', priceHT: 2.50 },
      { name: 'Orange sanguine', unit: 'kg', priceHT: 2.80 },
      { name: 'Orange Maltaise', unit: 'kg', priceHT: 2.50 },
      { name: 'Cox Orange', unit: 'kg', priceHT: 2.50 },
      { name: 'Orange Mignolas', unit: 'kg', priceHT: 2.50 },
      
      // Pomelos
      { name: 'Pomelos Rose', unit: 'piece', priceHT: 1.50 },
      { name: 'Pomelos Chinois', unit: 'piece', priceHT: 1.30 },
    ],
  },
  {
    name: 'Pommes & Poires',
    icon: '🍎',
    color: '#FF6B6B',
    description: 'Différentes variétés de pommes et poires',
    order: 2,
    subCategories: [
      { name: 'Pommes', icon: '🍎', order: 1 },
      { name: 'Poires', icon: '🍐', order: 2 },
    ],
    products: [
      // Pommes
      { name: 'P. Boskoop', unit: 'kg', priceHT: 2.80 },
      { name: 'P. Canada', unit: 'kg', priceHT: 2.50 },
      { name: 'P. Chanteclerc', unit: 'kg', priceHT: 2.60 },
      { name: 'P. Fuji', unit: 'kg', priceHT: 2.80 },
      { name: 'P. Gala grosse', unit: 'kg', priceHT: 2.60 },
      { name: 'P. Gala petite', unit: 'kg', priceHT: 2.40 },
      { name: 'P. Golden extra', unit: 'kg', priceHT: 2.60 },
      { name: 'P. golden petite', unit: 'kg', priceHT: 2.40 },
      { name: 'Granny', unit: 'kg', priceHT: 2.80 },
      { name: 'P. Pink lady', unit: 'kg', priceHT: 3.20 },
      { name: 'P. Red chef', unit: 'kg', priceHT: 2.80 },
      { name: 'P. Reinette', unit: 'kg', priceHT: 2.60 },
      { name: 'pomme sachet', unit: 'kg', priceHT: 2.50 },
      
      // Poires
      { name: 'Poire Pascrassane', unit: 'kg', priceHT: 2.80 },
      { name: 'poire Comice', unit: 'kg', priceHT: 2.80 },
      { name: 'Poire conférence', unit: 'kg', priceHT: 2.60 },
      { name: 'Poir Conference Promo', unit: 'kg', priceHT: 2.40 },
      { name: 'Poire Guyot', unit: 'kg', priceHT: 2.50 },
      { name: 'Poire Nashi', unit: 'kg', priceHT: 3.00 },
      { name: 'Poire Williams', unit: 'kg', priceHT: 2.60 },
    ],
  },
  {
    name: 'Fruits Rouges',
    icon: '🫐',
    color: '#E91E63',
    description: 'Fraise, framboise, groseille, mûre, myrtille',
    order: 3,
    subCategories: [
      { name: 'Fraises', icon: '🍓', order: 1 },
      { name: 'Framboises', icon: '🫐', order: 2 },
      { name: 'Groseilles', icon: '🫐', order: 3 },
      { name: 'Mûres', icon: '🫐', order: 4 },
      { name: 'Myrtilles', icon: '🫐', order: 5 },
    ],
    products: [
      // Fraises
      { name: 'Fraise barq 1kg Espagne', unit: 'caisse', priceHT: 4.50 },
      { name: 'Fraise barq 500g Espagne', unit: 'caisse', priceHT: 2.50 },
      { name: 'Fraise barq 500g France', unit: 'caisse', priceHT: 3.00 },
      { name: 'Fraise Belge', unit: 'kg', priceHT: 5.00 },
      { name: 'Fraise carpentras', unit: 'kg', priceHT: 4.80 },
      { name: 'Gariguette Saveol', unit: 'kg', priceHT: 5.50 },
      { name: 'Fraise barq Mariguette', unit: 'caisse', priceHT: 3.20 },
      { name: 'Mara des bois', unit: 'kg', priceHT: 6.00 },
      
      // Framboises
      { name: 'Framboise barq', unit: 'caisse', priceHT: 4.50 },
      
      // Groseilles
      { name: 'Groseille barq', unit: 'caisse', priceHT: 3.50 },
      
      // Mûres
      { name: 'Mure barq', unit: 'caisse', priceHT: 4.00 },
      
      // Myrtilles
      { name: 'Myrtille barq', unit: 'caisse', priceHT: 5.00 },
    ],
  },
  {
    name: 'Fruits d\'Été',
    icon: '🍑',
    color: '#FFB347',
    description: 'Cerises, figues, melons, abricots, nectarines, pêches',
    order: 4,
    subCategories: [
      { name: 'Cerises', icon: '🍒', order: 1 },
      { name: 'Figues', icon: '🫒', order: 2 },
      { name: 'Melons', icon: '🍈', order: 3 },
      { name: 'Abricots', icon: '🍑', order: 4 },
      { name: 'Nectarines', icon: '🍑', order: 5 },
      { name: 'Pêches', icon: '🍑', order: 6 },
    ],
    products: [
      // Cerises
      { name: 'Cerise Extra', unit: 'kg', priceHT: 6.00 },
      { name: 'Cerise 1er Prix 6', unit: 'kg', priceHT: 4.50 },
      { name: 'Cerise Rainier', unit: 'kg', priceHT: 7.00 },
      
      // Figues
      { name: 'Figue fraiche Noir', unit: 'kg', priceHT: 5.00 },
      { name: 'Figue fraiche Verte', unit: 'kg', priceHT: 5.00 },
      { name: 'Figue de barbarie', unit: 'kg', priceHT: 4.50 },
      { name: 'Figue baglama', unit: 'kg', priceHT: 4.00 },
      
      // Melons
      { name: 'Melon Char Gros', unit: 'piece', priceHT: 2.50 },
      { name: 'Melon 1er prix', unit: 'piece', priceHT: 1.80 },
      { name: 'Melon Galia', unit: 'piece', priceHT: 2.80 },
      { name: 'Melon jaune', unit: 'piece', priceHT: 2.50 },
      { name: 'Melon Vert', unit: 'piece', priceHT: 2.50 },
      
      // Abricots
      { name: 'Abricot ESP', unit: 'kg', priceHT: 4.00 },
      { name: 'Abricot FR', unit: 'kg', priceHT: 5.00 },
      { name: 'Abricot moilleux', unit: 'kg', priceHT: 4.50 },
      
      // Nectarines
      { name: 'Nectarine Blanche ESP', unit: 'kg', priceHT: 3.50 },
      { name: 'Nectarine Jaune ESP', unit: 'kg', priceHT: 3.50 },
      { name: 'Nectarine Plate ESP', unit: 'kg', priceHT: 3.80 },
      { name: 'Nectarine Blanche FR', unit: 'kg', priceHT: 4.50 },
      { name: 'Nectarine Jaune FR', unit: 'kg', priceHT: 4.50 },
      { name: 'Nectarine Plate FR', unit: 'kg', priceHT: 4.80 },
      { name: 'Nectarine Blanche Royal', unit: 'kg', priceHT: 5.00 },
      { name: 'Nectarine Jaune Royal', unit: 'kg', priceHT: 5.00 },
      
      // Pêches
      { name: 'Peche Blanche ESP', unit: 'kg', priceHT: 3.50 },
      { name: 'Peche Jaune Esp', unit: 'kg', priceHT: 3.50 },
      { name: 'Peche plate ESP', unit: 'kg', priceHT: 3.80 },
      { name: 'Peche Blanche FR', unit: 'kg', priceHT: 4.50 },
      { name: 'Peche Jaune FR', unit: 'kg', priceHT: 4.50 },
      { name: 'Peche plate FR', unit: 'kg', priceHT: 4.80 },
      { name: 'Peche Blanche Royal', unit: 'kg', priceHT: 5.00 },
      { name: 'Peche Jaune Royal', unit: 'kg', priceHT: 5.00 },
    ],
  },
  {
    name: 'Raisins',
    icon: '🍇',
    color: '#9B59B6',
    description: 'Différents types de raisins',
    order: 5,
    subCategories: [
      { name: 'Raisins blancs', icon: '🍇', order: 1 },
      { name: 'Raisins noirs', icon: '🍇', order: 2 },
      { name: 'Raisins roses', icon: '🍇', order: 3 },
      { name: 'Raisins spéciaux', icon: '🍇', order: 4 },
    ],
    products: [
      { name: 'Raisin Italia', unit: 'kg', priceHT: 3.50 },
      { name: 'Raisin blanc barq', unit: 'caisse', priceHT: 3.00 },
      { name: 'Raisin chasselas', unit: 'kg', priceHT: 3.80 },
      { name: 'Raisin chasselas barq', unit: 'caisse', priceHT: 3.50 },
      { name: 'Raisin Réd glob', unit: 'kg', priceHT: 4.00 },
      { name: 'Raisin blanc sans pepins', unit: 'kg', priceHT: 3.80 },
      { name: 'Raisin muscat', unit: 'kg', priceHT: 4.50 },
      { name: 'Raisin muscat barq', unit: 'caisse', priceHT: 4.20 },
      { name: 'Raisin noir', unit: 'kg', priceHT: 3.50 },
      { name: 'Raisin noir barq', unit: 'caisse', priceHT: 3.20 },
      { name: 'Raisin rose', unit: 'kg', priceHT: 3.80 },
      { name: 'Raisin rose barq', unit: 'caisse', priceHT: 3.50 },
    ],
  },
  {
    name: 'Fruits Autres',
    icon: '🍌',
    color: '#FFD700',
    description: 'Ananas, bananes, kiwis, mangues et autres fruits',
    order: 6,
    subCategories: [
      { name: 'Ananas', icon: '🍍', order: 1 },
      { name: 'Bananes', icon: '🍌', order: 2 },
      { name: 'Kiwis', icon: '🥝', order: 3 },
      { name: 'Mangues', icon: '🥭', order: 4 },
      { name: 'Autres', icon: '🍎', order: 5 },
    ],
    products: [
      // Ananas
      { name: 'Ananas', unit: 'piece', priceHT: 2.50 },
      { name: 'Ananas Victoria', unit: 'piece', priceHT: 3.00 },
      
      // Bananes
      { name: 'Banane', unit: 'kg', priceHT: 2.20 },
      { name: 'Banane bio', unit: 'kg', priceHT: 2.80 },
      { name: 'Banane plantain', unit: 'kg', priceHT: 2.50 },
      { name: 'Banane mini', unit: 'kg', priceHT: 2.80 },
      
      // Kiwis
      { name: 'Kiwi', unit: 'kg', priceHT: 4.00 },
      { name: 'Kiwi jaune', unit: 'kg', priceHT: 4.50 },
      { name: 'Kiwi barquette', unit: 'caisse', priceHT: 4.20 },
      
      // Mangues
      { name: 'Mangue Avion', unit: 'piece', priceHT: 2.50 },
      { name: 'Mangue Bateaux', unit: 'piece', priceHT: 2.20 },
      
      // Autres
      { name: 'Coing', unit: 'kg', priceHT: 3.50 },
      { name: 'Fruits de passion', unit: 'kg', priceHT: 6.00 },
      { name: 'Gingembre', unit: 'kg', priceHT: 8.00 },
      { name: 'Grenade Grosse', unit: 'piece', priceHT: 1.50 },
      { name: 'Grenade Machine', unit: 'piece', priceHT: 1.20 },
      { name: 'kaki', unit: 'kg', priceHT: 3.50 },
      { name: 'kaki brq', unit: 'caisse', priceHT: 3.20 },
    ],
  },
  {
    name: 'Fruits Exotiques',
    icon: '🥭',
    color: '#FF6347',
    description: 'Fruits exotiques et tropicaux',
    order: 7,
    subCategories: [
      { name: 'Avocats', icon: '🥑', order: 1 },
      { name: 'Fruits tropicaux', icon: '🥭', order: 2 },
      { name: 'Noix et amandes', icon: '🥜', order: 3 },
      { name: 'Autres exotiques', icon: '🍈', order: 4 },
    ],
    products: [
      // Avocats
      { name: 'Avocat Gros', unit: 'piece', priceHT: 1.80 },
      { name: 'Avocat Petit', unit: 'piece', priceHT: 1.20 },
      { name: 'Avocat tropical', unit: 'piece', priceHT: 1.50 },
      
      // Fruits tropicaux
      { name: 'Carambole', unit: 'kg', priceHT: 5.00 },
      { name: 'Litchi', unit: 'kg', priceHT: 8.00 },
      { name: 'litchi branche', unit: 'kg', priceHT: 8.50 },
      { name: 'Mangustan', unit: 'kg', priceHT: 7.00 },
      { name: 'Papaye', unit: 'piece', priceHT: 3.00 },
      { name: 'Physalis', unit: 'kg', priceHT: 12.00 },
      { name: 'Pitaya', unit: 'piece', priceHT: 4.00 },
      { name: 'Ramboutan', unit: 'kg', priceHT: 8.00 },
      
      // Noix et amandes
      { name: 'Noix Sèche/fraiche', unit: 'kg', priceHT: 8.00 },
      { name: 'Amande fraiche', unit: 'kg', priceHT: 10.00 },
      { name: 'Marron', unit: 'kg', priceHT: 6.00 },
      { name: 'Noix de coco', unit: 'piece', priceHT: 2.00 },
      
      // Autres
      { name: 'Anone', unit: 'piece', priceHT: 3.50 },
      { name: 'Nefle', unit: 'kg', priceHT: 4.00 },
      { name: 'Pomelos Chinois', unit: 'piece', priceHT: 1.30 },
    ],
  },
  {
    name: 'Dattes',
    icon: '🌴',
    color: '#8B4513',
    description: 'Différents types de dattes',
    order: 8,
    subCategories: [
      { name: 'Dattes fraîches', icon: '🌴', order: 1 },
      { name: 'Dattes séchées', icon: '🌴', order: 2 },
    ],
    products: [
      { name: 'datte ravier 250g', unit: 'caisse', priceHT: 3.50 },
      { name: 'Datte Ravier 500g', unit: 'caisse', priceHT: 6.50 },
      { name: 'Datte Fraiche', unit: 'kg', priceHT: 8.00 },
      { name: 'Datte Medjoul', unit: 'kg', priceHT: 12.00 },
      { name: 'Datte Bouquet', unit: 'kg', priceHT: 10.00 },
    ],
  },
  {
    name: 'Pastèque & Prunes',
    icon: '🍉',
    color: '#FF1493',
    description: 'Pastèques et différentes variétés de prunes',
    order: 9,
    subCategories: [
      { name: 'Pastèques', icon: '🍉', order: 1 },
      { name: 'Prunes', icon: '🟣', order: 2 },
    ],
    products: [
      // Pastèques
      { name: 'pastèque sans pépin', unit: 'piece', priceHT: 3.50 },
      { name: 'Pasteque Box', unit: 'caisse', priceHT: 3.00 },
      
      // Prunes
      { name: 'Prune jaune', unit: 'kg', priceHT: 3.50 },
      { name: 'Prune mirabelle', unit: 'kg', priceHT: 4.00 },
      { name: 'Prune noire', unit: 'kg', priceHT: 3.50 },
      { name: 'Prune quetsch', unit: 'kg', priceHT: 3.80 },
      { name: 'Prune reine claude', unit: 'kg', priceHT: 4.00 },
      { name: 'Prune rouge', unit: 'kg', priceHT: 3.50 },
      { name: 'Pruneau', unit: 'kg', priceHT: 5.00 },
    ],
  },
  {
    name: 'Autres Fruits',
    icon: '🍎',
    color: '#95A5A6',
    description: 'Fruits divers',
    order: 10,
    subCategories: [
      { name: 'Divers', icon: '🍎', order: 1 },
    ],
    products: [
      { name: 'Anonne', unit: 'piece', priceHT: 3.50 },
      { name: 'vanillé sofram', unit: 'kg', priceHT: 4.00 },
    ],
  },
];

async function main() {
  console.log('🌱 Début de l\'import des fruits...\n');

  try {
    let totalCategories = 0;
    let totalSubCategories = 0;
    let totalProducts = 0;

    for (const categoryData of categoriesData) {
      // Créer ou récupérer la catégorie
      let category = await prisma.category.findFirst({
        where: { name: categoryData.name, deletedAt: null },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: categoryData.name,
            icon: categoryData.icon,
            color: categoryData.color,
            description: categoryData.description,
            order: categoryData.order,
          },
        });
        console.log(`✅ Catégorie créée: ${categoryData.icon} ${categoryData.name}`);
        totalCategories++;
      } else {
        console.log(`ℹ️  Catégorie existante: ${categoryData.icon} ${categoryData.name}`);
      }

      // Créer les sous-catégories
      const subCategoryMap = new Map();
      for (const subCatData of categoryData.subCategories) {
        let subCategory = await prisma.subCategory.findFirst({
          where: {
            name: subCatData.name,
            categoryId: category.id,
            deletedAt: null,
          },
        });

        if (!subCategory) {
          subCategory = await prisma.subCategory.create({
            data: {
              name: subCatData.name,
              icon: subCatData.icon,
              categoryId: category.id,
              order: subCatData.order,
            },
          });
          console.log(`  ✅ Sous-catégorie créée: ${subCatData.icon} ${subCatData.name}`);
          totalSubCategories++;
        }
        subCategoryMap.set(subCatData.name, subCategory);
      }

      // Créer les produits
      for (const productData of categoryData.products) {
        // Déterminer la sous-catégorie basée sur le nom du produit
        let subCategoryId = null;
        for (const [subCatName, subCat] of subCategoryMap.entries()) {
          if (productData.name.toLowerCase().includes(subCatName.toLowerCase().substring(0, 5))) {
            subCategoryId = subCat.id;
            break;
          }
        }
        // Si aucune correspondance, utiliser la première sous-catégorie
        if (!subCategoryId && subCategoryMap.size > 0) {
          subCategoryId = Array.from(subCategoryMap.values())[0].id;
        }

        // Vérifier si le produit existe déjà
        const existingProduct = await prisma.product.findFirst({
          where: {
            name: productData.name,
            deletedAt: null,
          },
        });

        if (!existingProduct) {
          await prisma.product.create({
            data: {
              name: productData.name,
              priceHT: productData.priceHT,
              tvaRate: 5.5,
              unit: productData.unit,
              categoryId: category.id,
              subCategoryId: subCategoryId,
              category: 'FRUITS', // Valeur par défaut pour rétrocompatibilité
              stock: 0,
              stockAlert: 10,
              isActive: true,
              isVisibleToClients: true,
            },
          });
          console.log(`    ✅ Produit créé: ${productData.name}`);
          totalProducts++;
        } else {
          console.log(`    ℹ️  Produit existant: ${productData.name}`);
        }
      }

      console.log('');
    }

    console.log('\n📊 Résumé de l\'import:');
    console.log(`   - ${totalCategories} catégorie(s) créée(s)`);
    console.log(`   - ${totalSubCategories} sous-catégorie(s) créée(s)`);
    console.log(`   - ${totalProducts} produit(s) créé(s)`);
    console.log('\n✅ Import terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
