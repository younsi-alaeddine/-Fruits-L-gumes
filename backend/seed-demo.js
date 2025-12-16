/**
 * Script de seed pour créer des comptes DEMO avec données complètes
 * Usage: node seed-demo.js
 * 
 * Comptes créés:
 * - ADMIN: admin@demo.com / admin123
 * - CLIENT 1: client1@demo.com / client123
 * - CLIENT 2: client2@demo.com / client123
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed DEMO...\n');

  // Nettoyer les données existantes (optionnel - commenté pour sécurité)
  // console.log('⚠️  Nettoyage des données existantes...');
  // await prisma.orderItem.deleteMany();
  // await prisma.order.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.shop.deleteMany();
  // await prisma.user.deleteMany();

  // ============================================
  // 1. CRÉER L'ADMINISTRATEUR
  // ============================================
  console.log('👤 Création de l\'administrateur...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      name: 'Administrateur Demo',
      email: 'admin@demo.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+33123456789'
    }
  });
  console.log('✅ Admin créé:', admin.email, '/ Mot de passe: admin123\n');

  // ============================================
  // 2. CRÉER LES CLIENTS AVEC MAGASINS
  // ============================================
  
  // Client 1
  console.log('🏪 Création du client 1...');
  const client1Password = await bcrypt.hash('client123', 10);
  const client1 = await prisma.user.upsert({
    where: { email: 'client1@demo.com' },
    update: {},
    create: {
      name: 'Jean Dupont',
      email: 'client1@demo.com',
      password: client1Password,
      role: 'CLIENT',
      phone: '+33987654321',
      shop: {
        create: {
          name: 'Épicerie du Centre',
          address: '15 Rue de la République',
          city: 'Paris',
          postalCode: '75001',
          phone: '+33987654321'
        }
      }
    },
    include: { shop: true }
  });
  console.log('✅ Client 1 créé:', client1.email, '/ Mot de passe: client123');
  console.log('   Magasin:', client1.shop.name, '\n');

  // Client 2
  console.log('🏪 Création du client 2...');
  const client2Password = await bcrypt.hash('client123', 10);
  const client2 = await prisma.user.upsert({
    where: { email: 'client2@demo.com' },
    update: {},
    create: {
      name: 'Marie Martin',
      email: 'client2@demo.com',
      password: client2Password,
      role: 'CLIENT',
      phone: '+33987654322',
      shop: {
        create: {
          name: 'Super Marché Lyon',
          address: '42 Avenue des Champs',
          city: 'Lyon',
          postalCode: '69001',
          phone: '+33987654322'
        }
      }
    },
    include: { shop: true }
  });
  console.log('✅ Client 2 créé:', client2.email, '/ Mot de passe: client123');
  console.log('   Magasin:', client2.shop.name, '\n');

  // Client 3
  console.log('🏪 Création du client 3...');
  const client3Password = await bcrypt.hash('client123', 10);
  const client3 = await prisma.user.upsert({
    where: { email: 'client3@demo.com' },
    update: {},
    create: {
      name: 'Pierre Durand',
      email: 'client3@demo.com',
      password: client3Password,
      role: 'CLIENT',
      phone: '+33987654323',
      shop: {
        create: {
          name: 'Fruits & Légumes Marseille',
          address: '8 Boulevard du Vieux Port',
          city: 'Marseille',
          postalCode: '13001',
          phone: '+33987654323'
        }
      }
    },
    include: { shop: true }
  });
  console.log('✅ Client 3 créé:', client3.email, '/ Mot de passe: client123');
  console.log('   Magasin:', client3.shop.name, '\n');

  // ============================================
  // 3. CRÉER LES PRODUITS
  // ============================================
  console.log('🥬 Création des produits...\n');
  
  const products = [
    {
      name: 'Tomates',
      priceHT: 2.50,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Carottes',
      priceHT: 1.80,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Pommes Golden',
      priceHT: 3.20,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Pommes Gala',
      priceHT: 3.50,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Salade verte',
      priceHT: 1.50,
      tvaRate: 5.5,
      unit: 'piece',
      isActive: true
    },
    {
      name: 'Bananes',
      priceHT: 2.90,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Oranges',
      priceHT: 2.70,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Courgettes',
      priceHT: 2.20,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Pommes de terre',
      priceHT: 1.60,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Oignons',
      priceHT: 1.90,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Poivrons rouges',
      priceHT: 4.50,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Concombres',
      priceHT: 2.30,
      tvaRate: 5.5,
      unit: 'piece',
      isActive: true
    },
    {
      name: 'Aubergines',
      priceHT: 3.80,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Fraises',
      priceHT: 5.90,
      tvaRate: 5.5,
      unit: 'caisse',
      isActive: true
    },
    {
      name: 'Raisin blanc',
      priceHT: 4.20,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Citrons',
      priceHT: 3.50,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Brocolis',
      priceHT: 2.80,
      tvaRate: 5.5,
      unit: 'piece',
      isActive: true
    },
    {
      name: 'Champignons',
      priceHT: 6.50,
      tvaRate: 5.5,
      unit: 'kg',
      isActive: true
    },
    {
      name: 'Avocats',
      priceHT: 4.80,
      tvaRate: 5.5,
      unit: 'piece',
      isActive: true
    },
    {
      name: 'Poireaux',
      priceHT: 2.40,
      tvaRate: 5.5,
      unit: 'piece',
      isActive: true
    }
  ];

  const createdProducts = [];
  for (const product of products) {
    // Vérifier si le produit existe déjà
    const existing = await prisma.product.findFirst({
      where: { name: product.name }
    });
    
    let created;
    if (existing) {
      // Mettre à jour le produit existant
      created = await prisma.product.update({
        where: { id: existing.id },
        data: product
      });
    } else {
      // Créer un nouveau produit
      created = await prisma.product.create({
        data: product
      });
    }
    createdProducts.push(created);
    console.log(`   ✅ ${created.name} - ${created.priceHT}€ HT (${created.unit})`);
  }

  console.log(`\n✅ ${createdProducts.length} produits créés\n`);

  // ============================================
  // 4. CRÉER DES COMMANDES D'EXEMPLE
  // ============================================
  console.log('📦 Création de commandes d\'exemple...\n');

  // Fonction pour calculer les totaux
  const calculateTotals = (items) => {
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    items.forEach(item => {
      const product = createdProducts.find(p => p.id === item.productId);
      const itemHT = item.quantity * product.priceHT;
      const itemTVA = itemHT * (product.tvaRate / 100);
      const itemTTC = itemHT + itemTVA;

      totalHT += itemHT;
      totalTVA += itemTVA;
      totalTTC += itemTTC;
    });

    return {
      totalHT: Math.round(totalHT * 100) / 100,
      totalTVA: Math.round(totalTVA * 100) / 100,
      totalTTC: Math.round(totalTTC * 100) / 100
    };
  };

  // Commande 1 - Client 1 (Nouvelle)
  const order1Items = [
    { productId: createdProducts[0].id, quantity: 10 }, // Tomates
    { productId: createdProducts[1].id, quantity: 5 },  // Carottes
    { productId: createdProducts[2].id, quantity: 8 }   // Pommes Golden
  ];
  const order1Totals = calculateTotals(order1Items);
  
  const order1 = await prisma.order.create({
    data: {
      shopId: client1.shop.id,
      status: 'NEW',
      ...order1Totals,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2 heures
      items: {
        create: order1Items.map(item => {
          const product = createdProducts.find(p => p.id === item.productId);
          const itemHT = item.quantity * product.priceHT;
          const itemTVA = itemHT * (product.tvaRate / 100);
          return {
            productId: item.productId,
            quantity: item.quantity,
            priceHT: product.priceHT,
            totalHT: Math.round(itemHT * 100) / 100,
            totalTVA: Math.round(itemTVA * 100) / 100,
            totalTTC: Math.round((itemHT + itemTVA) * 100) / 100
          };
        })
      }
    }
  });
  console.log(`✅ Commande 1 créée pour ${client1.shop.name} - ${order1Totals.totalTTC.toFixed(2)}€ TTC (NEW)`);

  // Commande 2 - Client 1 (En préparation)
  const order2Items = [
    { productId: createdProducts[5].id, quantity: 12 }, // Bananes
    { productId: createdProducts[6].id, quantity: 8 },  // Oranges
    { productId: createdProducts[4].id, quantity: 5 }    // Salade
  ];
  const order2Totals = calculateTotals(order2Items);
  
  const order2 = await prisma.order.create({
    data: {
      shopId: client1.shop.id,
      status: 'PREPARATION',
      ...order2Totals,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hier
      items: {
        create: order2Items.map(item => {
          const product = createdProducts.find(p => p.id === item.productId);
          const itemHT = item.quantity * product.priceHT;
          const itemTVA = itemHT * (product.tvaRate / 100);
          return {
            productId: item.productId,
            quantity: item.quantity,
            priceHT: product.priceHT,
            totalHT: Math.round(itemHT * 100) / 100,
            totalTVA: Math.round(itemTVA * 100) / 100,
            totalTTC: Math.round((itemHT + itemTVA) * 100) / 100
          };
        })
      }
    }
  });
  console.log(`✅ Commande 2 créée pour ${client1.shop.name} - ${order2Totals.totalTTC.toFixed(2)}€ TTC (PREPARATION)`);

  // Commande 3 - Client 2 (En livraison)
  const order3Items = [
    { productId: createdProducts[7].id, quantity: 15 }, // Courgettes
    { productId: createdProducts[8].id, quantity: 20 }, // Pommes de terre
    { productId: createdProducts[9].id, quantity: 10 } // Oignons
  ];
  const order3Totals = calculateTotals(order3Items);
  
  const order3 = await prisma.order.create({
    data: {
      shopId: client2.shop.id,
      status: 'LIVRAISON',
      ...order3Totals,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // Il y a 12 heures
      items: {
        create: order3Items.map(item => {
          const product = createdProducts.find(p => p.id === item.productId);
          const itemHT = item.quantity * product.priceHT;
          const itemTVA = itemHT * (product.tvaRate / 100);
          return {
            productId: item.productId,
            quantity: item.quantity,
            priceHT: product.priceHT,
            totalHT: Math.round(itemHT * 100) / 100,
            totalTVA: Math.round(itemTVA * 100) / 100,
            totalTTC: Math.round((itemHT + itemTVA) * 100) / 100
          };
        })
      }
    }
  });
  console.log(`✅ Commande 3 créée pour ${client2.shop.name} - ${order3Totals.totalTTC.toFixed(2)}€ TTC (LIVRAISON)`);

  // Commande 4 - Client 2 (Livrée)
  const order4Items = [
    { productId: createdProducts[10].id, quantity: 5 },  // Poivrons
    { productId: createdProducts[11].id, quantity: 8 },  // Concombres
    { productId: createdProducts[12].id, quantity: 6 }    // Aubergines
  ];
  const order4Totals = calculateTotals(order4Items);
  
  const order4 = await prisma.order.create({
    data: {
      shopId: client2.shop.id,
      status: 'LIVREE',
      ...order4Totals,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
      items: {
        create: order4Items.map(item => {
          const product = createdProducts.find(p => p.id === item.productId);
          const itemHT = item.quantity * product.priceHT;
          const itemTVA = itemHT * (product.tvaRate / 100);
          return {
            productId: item.productId,
            quantity: item.quantity,
            priceHT: product.priceHT,
            totalHT: Math.round(itemHT * 100) / 100,
            totalTVA: Math.round(itemTVA * 100) / 100,
            totalTTC: Math.round((itemHT + itemTVA) * 100) / 100
          };
        })
      }
    }
  });
  console.log(`✅ Commande 4 créée pour ${client2.shop.name} - ${order4Totals.totalTTC.toFixed(2)}€ TTC (LIVREE)`);

  // Commande 5 - Client 3 (Nouvelle - aujourd'hui)
  const order5Items = [
    { productId: createdProducts[13].id, quantity: 3 },  // Fraises
    { productId: createdProducts[14].id, quantity: 7 },   // Raisin
    { productId: createdProducts[15].id, quantity: 4 }   // Citrons
  ];
  const order5Totals = calculateTotals(order5Items);
  
  const order5 = await prisma.order.create({
    data: {
      shopId: client3.shop.id,
      status: 'NEW',
      ...order5Totals,
      createdAt: new Date(), // Aujourd'hui
      items: {
        create: order5Items.map(item => {
          const product = createdProducts.find(p => p.id === item.productId);
          const itemHT = item.quantity * product.priceHT;
          const itemTVA = itemHT * (product.tvaRate / 100);
          return {
            productId: item.productId,
            quantity: item.quantity,
            priceHT: product.priceHT,
            totalHT: Math.round(itemHT * 100) / 100,
            totalTVA: Math.round(itemTVA * 100) / 100,
            totalTTC: Math.round((itemHT + itemTVA) * 100) / 100
          };
        })
      }
    }
  });
  console.log(`✅ Commande 5 créée pour ${client3.shop.name} - ${order5Totals.totalTTC.toFixed(2)}€ TTC (NEW)`);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED DEMO TERMINÉ AVEC SUCCÈS!');
  console.log('='.repeat(60));
  console.log('\n📋 COMPTES CRÉÉS:\n');
  console.log('👨‍💼 ADMINISTRATEUR:');
  console.log('   Email: admin@demo.com');
  console.log('   Mot de passe: admin123');
  console.log('\n👤 CLIENTS:');
  console.log('   Client 1: client1@demo.com / client123');
  console.log('   Client 2: client2@demo.com / client123');
  console.log('   Client 3: client3@demo.com / client123');
  console.log('\n📊 STATISTIQUES:');
  console.log(`   - ${createdProducts.length} produits créés`);
  console.log('   - 5 commandes créées avec différents statuts');
  console.log('   - 3 magasins clients');
  console.log('\n🌐 ACCÈS:');
  console.log('   Frontend: http://localhost:3000');
  console.log('   Backend:  http://localhost:5000');
  console.log('\n' + '='.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

