const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

/**
 * Script de seed avec données de test pour 3 jours
 * Génère des utilisateurs, produits, commandes, devis, paiements, livraisons
 * sur une période de 3 jours pour tester le déroulement complet
 */

// Dates pour les 3 jours
const aujourdhui = new Date();
const hier = new Date(aujourdhui);
hier.setDate(hier.getDate() - 1);
const avantHier = new Date(aujourdhui);
avantHier.setDate(avantHier.getDate() - 2);

// Fonction pour générer une date aléatoire dans une journée
function randomDateInDay(day) {
  const date = new Date(day);
  date.setHours(Math.floor(Math.random() * 12) + 8); // Entre 8h et 20h
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

// Hash du mot de passe par défaut
const defaultPassword = 'demo123';
let hashedPassword;

async function hashPassword() {
  hashedPassword = await bcrypt.hash(defaultPassword, 10);
}

async function main() {
  console.log('🌱 Début du seed pour 3 jours de données...\n');

  await hashPassword();

  // 1. Créer un admin
  console.log('📝 Création de l\'administrateur...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Administrateur',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '01 23 45 67 89',
    },
  });
  console.log('✅ Admin créé:', admin.email);

  // 2. Créer des clients (magasins)
  console.log('\n📝 Création des clients...');
  const clientsData = [
    {
      user: {
        email: 'client1@demo.com',
        name: 'Jean Dupont',
        password: hashedPassword,
        role: 'CLIENT',
        phone: '01 11 22 33 44',
      },
      shop: {
        name: 'Épicerie du Centre',
        address: '15 Rue de la République',
        city: 'Paris',
        postalCode: '75001',
        phone: '01 11 22 33 44',
      },
    },
    {
      user: {
        email: 'client2@demo.com',
        name: 'Marie Martin',
        password: hashedPassword,
        role: 'CLIENT',
        phone: '04 22 33 44 55',
      },
      shop: {
        name: 'Super Marché Lyon',
        address: '42 Avenue de la Part-Dieu',
        city: 'Lyon',
        postalCode: '69003',
        phone: '04 22 33 44 55',
      },
    },
    {
      user: {
        email: 'client3@demo.com',
        name: 'Pierre Bernard',
        password: hashedPassword,
        role: 'CLIENT',
        phone: '04 33 44 55 66',
      },
      shop: {
        name: 'Fruits & Légumes Marseille',
        address: '88 Boulevard Longchamp',
        city: 'Marseille',
        postalCode: '13001',
        phone: '04 33 44 55 66',
      },
    },
  ];

  const clients = [];
  for (const data of clientsData) {
    const user = await prisma.user.upsert({
      where: { email: data.user.email },
      update: {},
      create: data.user,
    });

    const shop = await prisma.shop.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        ...data.shop,
        userId: user.id,
      },
    });

    clients.push({ user, shop });
    console.log(`✅ Client créé: ${data.shop.name} (${data.user.email})`);
  }

  // 3. Créer des catégories personnalisées
  console.log('\n📝 Création des catégories...');
  const categoriesData = [
    {
      name: 'OIGNONS & PDT',
      icon: '🧅',
      color: '#FFA500',
      subCategories: ['Oignons', 'Pommes de terre', 'Échalotes'],
    },
    {
      name: 'LÉGUMES',
      icon: '🥕',
      color: '#FF6347',
      subCategories: ['Carottes', 'Courgettes', 'Aubergines', 'Poivrons'],
    },
    {
      name: 'HERBES',
      icon: '🌿',
      color: '#32CD32',
      subCategories: ['Basilic', 'Persil', 'Ciboulette', 'Coriandre'],
    },
    {
      name: 'SALADES',
      icon: '🥬',
      color: '#90EE90',
      subCategories: ['Laitue', 'Roquette', 'Mâche', 'Endive'],
    },
    {
      name: 'RATATOUILLE',
      icon: '🍆',
      color: '#8B4513',
      subCategories: ['Tomates', 'Courgettes', 'Aubergines', 'Poivrons'],
    },
    {
      name: 'TOMATES',
      icon: '🍅',
      color: '#FF0000',
      subCategories: ['Tomates cerises', 'Tomates rondes', 'Tomates allongées'],
    },
    {
      name: 'CHAMPIGNONS',
      icon: '🍄',
      color: '#D2691E',
      subCategories: ['Champignons de Paris', 'Cèpes', 'Girolles'],
    },
  ];

  const categories = [];
  for (const catData of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: catData.name },
      update: {},
      create: {
        name: catData.name,
        icon: catData.icon,
        color: catData.color,
        isActive: true,
        order: categories.length,
      },
    });

    // Créer les sous-catégories
    for (const subName of catData.subCategories) {
      await prisma.subCategory.upsert({
        where: {
          categoryId_name: {
            categoryId: category.id,
            name: subName,
          },
        },
        update: {},
        create: {
          name: subName,
          categoryId: category.id,
          isActive: true,
        },
      });
    }

    categories.push(category);
    console.log(`✅ Catégorie créée: ${catData.name}`);
  }

  // 4. Créer des produits
  console.log('\n📝 Création des produits...');
  const produitsData = [
    // OIGNONS & PDT
    { name: 'Oignons jaunes', priceHT: 1.20, tvaRate: 5.5, unit: 'kg', stock: 500, categoryName: 'OIGNONS & PDT', subCategoryName: 'Oignons' },
    { name: 'Oignons rouges', priceHT: 1.50, tvaRate: 5.5, unit: 'kg', stock: 300, categoryName: 'OIGNONS & PDT', subCategoryName: 'Oignons' },
    { name: 'Pommes de terre', priceHT: 0.80, tvaRate: 5.5, unit: 'kg', stock: 1000, categoryName: 'OIGNONS & PDT', subCategoryName: 'Pommes de terre' },
    { name: 'Échalotes', priceHT: 2.50, tvaRate: 5.5, unit: 'kg', stock: 200, categoryName: 'OIGNONS & PDT', subCategoryName: 'Échalotes' },
    
    // LÉGUMES
    { name: 'Carottes', priceHT: 1.00, tvaRate: 5.5, unit: 'kg', stock: 800, categoryName: 'LÉGUMES', subCategoryName: 'Carottes' },
    { name: 'Courgettes', priceHT: 1.80, tvaRate: 5.5, unit: 'kg', stock: 400, categoryName: 'LÉGUMES', subCategoryName: 'Courgettes' },
    { name: 'Aubergines', priceHT: 2.20, tvaRate: 5.5, unit: 'kg', stock: 300, categoryName: 'LÉGUMES', subCategoryName: 'Aubergines' },
    { name: 'Poivrons rouges', priceHT: 2.50, tvaRate: 5.5, unit: 'kg', stock: 250, categoryName: 'LÉGUMES', subCategoryName: 'Poivrons' },
    
    // HERBES
    { name: 'Basilic', priceHT: 3.50, tvaRate: 5.5, unit: 'botte', stock: 150, categoryName: 'HERBES', subCategoryName: 'Basilic' },
    { name: 'Persil', priceHT: 2.00, tvaRate: 5.5, unit: 'botte', stock: 200, categoryName: 'HERBES', subCategoryName: 'Persil' },
    { name: 'Ciboulette', priceHT: 2.50, tvaRate: 5.5, unit: 'botte', stock: 100, categoryName: 'HERBES', subCategoryName: 'Ciboulette' },
    
    // SALADES
    { name: 'Laitue', priceHT: 1.20, tvaRate: 5.5, unit: 'piece', stock: 300, categoryName: 'SALADES', subCategoryName: 'Laitue' },
    { name: 'Roquette', priceHT: 4.00, tvaRate: 5.5, unit: 'kg', stock: 80, categoryName: 'SALADES', subCategoryName: 'Roquette' },
    { name: 'Mâche', priceHT: 3.50, tvaRate: 5.5, unit: 'kg', stock: 120, categoryName: 'SALADES', subCategoryName: 'Mâche' },
    
    // TOMATES
    { name: 'Tomates cerises', priceHT: 3.00, tvaRate: 5.5, unit: 'kg', stock: 350, categoryName: 'TOMATES', subCategoryName: 'Tomates cerises' },
    { name: 'Tomates rondes', priceHT: 2.20, tvaRate: 5.5, unit: 'kg', stock: 500, categoryName: 'TOMATES', subCategoryName: 'Tomates rondes' },
    { name: 'Tomates allongées', priceHT: 2.50, tvaRate: 5.5, unit: 'kg', stock: 400, categoryName: 'TOMATES', subCategoryName: 'Tomates allongées' },
    
    // CHAMPIGNONS
    { name: 'Champignons de Paris', priceHT: 4.50, tvaRate: 5.5, unit: 'kg', stock: 200, categoryName: 'CHAMPIGNONS', subCategoryName: 'Champignons de Paris' },
    { name: 'Cèpes', priceHT: 12.00, tvaRate: 5.5, unit: 'kg', stock: 50, categoryName: 'CHAMPIGNONS', subCategoryName: 'Cèpes' },
  ];

  const produits = [];
  for (const prodData of produitsData) {
    const category = categories.find(c => c.name === prodData.categoryName);
    if (!category) continue;

    const subCategory = await prisma.subCategory.findFirst({
      where: {
        categoryId: category.id,
        name: prodData.subCategoryName,
      },
    });

    const produit = await prisma.product.create({
      data: {
        name: prodData.name,
        priceHT: prodData.priceHT,
        tvaRate: prodData.tvaRate,
        unit: prodData.unit,
        stock: prodData.stock,
        stockAlert: 50,
        categoryId: category.id,
        subCategoryId: subCategory?.id,
        isActive: true,
        isVisibleToClients: true,
      },
    });

    produits.push(produit);
  }
  console.log(`✅ ${produits.length} produits créés`);

  // 5. Créer des commandes sur 3 jours
  console.log('\n📝 Création des commandes sur 3 jours...');
  
  const orders = [];
  const dates = [avantHier, hier, aujourdhui];
  
  for (let dayIndex = 0; dayIndex < 3; dayIndex++) {
    const day = dates[dayIndex];
    const dayName = dayIndex === 0 ? 'Avant-hier' : dayIndex === 1 ? 'Hier' : "Aujourd'hui";
    
    // 2-3 commandes par jour par client
    for (let clientIndex = 0; clientIndex < clients.length; clientIndex++) {
      const numOrders = Math.floor(Math.random() * 2) + 2; // 2-3 commandes
      
      for (let o = 0; o < numOrders; o++) {
        const orderDate = randomDateInDay(day);
        
        // Sélectionner 3-6 produits aléatoires
        const numItems = Math.floor(Math.random() * 4) + 3;
        const selectedProducts = [];
        for (let i = 0; i < numItems; i++) {
          const randomProduct = produits[Math.floor(Math.random() * produits.length)];
          if (!selectedProducts.find(p => p.id === randomProduct.id)) {
            selectedProducts.push(randomProduct);
          }
        }

        // Créer les order items
        const orderItems = [];
        let totalHT = 0;
        let totalTVA = 0;
        let totalTTC = 0;

        for (const product of selectedProducts) {
          const quantity = Math.floor(Math.random() * 20) + 5; // 5-25 unités
          const priceHT = product.priceHT;
          const itemTotalHT = quantity * priceHT;
          const itemTVA = itemTotalHT * (product.tvaRate / 100);
          const itemTotalTTC = itemTotalHT + itemTVA;

          totalHT += itemTotalHT;
          totalTVA += itemTVA;
          totalTTC += itemTotalTTC;

          orderItems.push({
            productId: product.id,
            quantity,
            priceHT,
            totalHT: itemTotalHT,
            totalTVA: itemTVA,
            totalTTC: itemTotalTTC,
          });
        }

        // Déterminer le statut selon la date
        let status = 'NEW';
        let paymentStatus = 'EN_ATTENTE';
        if (dayIndex === 0) {
          // Avant-hier : certaines livrées, certaines en préparation
          status = Math.random() > 0.3 ? 'LIVREE' : 'PREPARATION';
          paymentStatus = status === 'LIVREE' ? (Math.random() > 0.5 ? 'PAYE' : 'EN_ATTENTE') : 'EN_ATTENTE';
        } else if (dayIndex === 1) {
          // Hier : mix de statuts
          const rand = Math.random();
          if (rand > 0.6) status = 'LIVREE';
          else if (rand > 0.3) status = 'LIVRAISON';
          else status = 'PREPARATION';
          paymentStatus = status === 'LIVREE' ? (Math.random() > 0.4 ? 'PAYE' : 'EN_ATTENTE') : 'EN_ATTENTE';
        } else {
          // Aujourd'hui : principalement NEW et PREPARATION
          status = Math.random() > 0.5 ? 'NEW' : 'PREPARATION';
        }

        // Générer numéro de commande
        const orderNumber = `CMD-${day.getFullYear()}${String(day.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

        const order = await prisma.order.create({
          data: {
            shopId: clients[clientIndex].shop.id,
            orderNumber,
            status,
            paymentStatus,
            totalHT,
            totalTVA,
            totalTTC,
            createdAt: orderDate,
            items: {
              create: orderItems,
            },
          },
        });

        orders.push(order);

        // Créer des paiements pour les commandes payées
        if (paymentStatus === 'PAYE' || (status === 'LIVREE' && Math.random() > 0.3)) {
          const paymentDate = new Date(orderDate);
          paymentDate.setHours(paymentDate.getHours() + Math.floor(Math.random() * 24) + 1);

          await prisma.payment.create({
            data: {
              orderId: order.id,
              amount: totalTTC,
              paymentMethod: ['CASH', 'CARD', 'TRANSFER'][Math.floor(Math.random() * 3)],
              paymentDate,
              status: 'PAYE',
            },
          });
        }

        // Créer des livraisons pour les commandes livrées
        if (status === 'LIVREE' || status === 'LIVRAISON') {
          const deliveryDate = new Date(orderDate);
          deliveryDate.setDate(deliveryDate.getDate() + 1);
          deliveryDate.setHours(Math.floor(Math.random() * 8) + 9); // 9h-17h

          await prisma.delivery.create({
            data: {
              orderId: order.id,
              deliveryDate,
              timeSlot: `${String(Math.floor(Math.random() * 3) + 9).padStart(2, '0')}:00-${String(Math.floor(Math.random() * 3) + 12).padStart(2, '0')}:00`,
              status: status === 'LIVREE' ? 'DELIVERED' : 'IN_TRANSIT',
            },
          });
        }
      }
    }
    
    console.log(`✅ ${dayName}: ${orders.filter(o => new Date(o.createdAt).toDateString() === day.toDateString()).length} commandes créées`);
  }

  // 6. Créer des devis (quelques-uns convertis en commandes)
  console.log('\n📝 Création des devis...');
  const quotes = [];
  for (let i = 0; i < 5; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const quoteDate = randomDateInDay(avantHier);
    const validUntil = new Date(quoteDate);
    validUntil.setDate(validUntil.getDate() + 15);

    const selectedProducts = produits.slice(0, Math.floor(Math.random() * 5) + 3);
    const quoteItems = [];
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    for (const product of selectedProducts) {
      const quantity = Math.floor(Math.random() * 15) + 5;
      const priceHT = product.priceHT;
      const itemTotalHT = quantity * priceHT;
      const itemTVA = itemTotalHT * (product.tvaRate / 100);
      const itemTotalTTC = itemTotalHT + itemTVA;

      totalHT += itemTotalHT;
      totalTVA += itemTVA;
      totalTTC += itemTotalTTC;

      quoteItems.push({
        productId: product.id,
        quantity,
        priceHT,
        totalHT: itemTotalHT,
        totalTVA: itemTVA,
        totalTTC: itemTotalTTC,
      });
    }

    const quoteNumber = `DEV-${quoteDate.getFullYear()}${String(quoteDate.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
    const status = i < 2 ? 'CONVERTED' : (i < 4 ? 'SENT' : 'DRAFT');

    const quote = await prisma.quote.create({
      data: {
        shopId: client.shop.id,
        quoteNumber,
        validUntil,
        status,
        totalHT,
        totalTVA,
        totalTTC,
        createdAt: quoteDate,
        items: {
          create: quoteItems,
        },
      },
    });

    quotes.push(quote);
  }
  console.log(`✅ ${quotes.length} devis créés`);

  // 7. Créer des notifications
  console.log('\n📝 Création des notifications...');
  let notificationCount = 0;
  for (const order of orders) {
    if (Math.random() > 0.7) continue; // 30% de notifications

    const shop = await prisma.shop.findUnique({
      where: { id: order.shopId },
      include: { user: true },
    });

    if (shop && shop.user) {
      await prisma.notification.create({
        data: {
          userId: shop.user.id,
          type: 'ORDER_STATUS_CHANGED',
          title: 'Statut de commande modifié',
          message: `Votre commande ${order.orderNumber} est maintenant ${order.status}`,
          data: JSON.stringify({ orderId: order.id }),
        },
      });
      notificationCount++;
    }
  }
  console.log(`✅ ${notificationCount} notifications créées`);

  // 8. Créer des logs d'audit
  console.log('\n📝 Création des logs d\'audit...');
  let auditCount = 0;
  for (const order of orders.slice(0, 10)) {
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Order',
        entityId: order.id,
        userId: admin.id,
        changes: JSON.stringify({ status: order.status }),
        ip: '127.0.0.1',
      },
    });
    auditCount++;
  }
  console.log(`✅ ${auditCount} logs d'audit créés`);

  // Résumé final
  console.log('\n' + '='.repeat(50));
  console.log('✅ SEED TERMINÉ AVEC SUCCÈS !');
  console.log('='.repeat(50));
  console.log('\n📊 Résumé des données créées :');
  console.log(`   👤 Utilisateurs : ${1 + clients.length} (1 admin + ${clients.length} clients)`);
  console.log(`   🏪 Magasins : ${clients.length}`);
  console.log(`   📁 Catégories : ${categories.length}`);
  console.log(`   📦 Produits : ${produits.length}`);
  console.log(`   🛒 Commandes : ${orders.length}`);
  console.log(`   📄 Devis : ${quotes.length}`);
  console.log(`   🔔 Notifications : ${notificationCount}`);
  console.log(`   📋 Logs d'audit : ${auditCount}`);
  console.log('\n🔑 Comptes de test :');
  console.log(`   Admin : admin@demo.com / ${defaultPassword}`);
  for (const client of clients) {
    console.log(`   Client : ${client.user.email} / ${defaultPassword}`);
  }
  console.log('\n📅 Données réparties sur 3 jours :');
  console.log(`   Avant-hier : ${orders.filter(o => new Date(o.createdAt).toDateString() === avantHier.toDateString()).length} commandes`);
  console.log(`   Hier : ${orders.filter(o => new Date(o.createdAt).toDateString() === hier.toDateString()).length} commandes`);
  console.log(`   Aujourd'hui : ${orders.filter(o => new Date(o.createdAt).toDateString() === aujourdhui.toDateString()).length} commandes`);
  console.log('\n✨ Vous pouvez maintenant tester toutes les fonctionnalités !\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
