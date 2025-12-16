/**
 * Script pour importer les données exportées vers Render
 * Usage: node scripts/import-data.js
 * 
 * Lit le fichier data-export.json et importe toutes les données
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function importData() {
  try {
    console.log('📥 Début de l\'import des données...\n');

    // Lire le fichier d'export
    const exportPath = path.join(__dirname, '..', 'data-export.json');
    
    if (!fs.existsSync(exportPath)) {
      console.error('❌ Fichier data-export.json non trouvé!');
      console.error('💡 Exécutez d\'abord: node scripts/export-data.js');
      process.exit(1);
    }

    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    
    console.log(`📄 Fichier d'export trouvé (version ${exportData.version})`);
    console.log(`📅 Exporté le: ${exportData.exportedAt}\n`);

    // 1. Importer les utilisateurs
    console.log('👤 Import des utilisateurs...');
    let usersCreated = 0;
    let usersUpdated = 0;
    
    for (const userData of exportData.users) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          password: userData.password, // Conserver le hash du mot de passe
          role: userData.role,
          phone: userData.phone,
          resetToken: userData.resetToken,
          resetTokenExpiry: userData.resetTokenExpiry,
          deletedAt: userData.deletedAt
        },
        create: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          phone: userData.phone,
          resetToken: userData.resetToken,
          resetTokenExpiry: userData.resetTokenExpiry,
          deletedAt: userData.deletedAt,
          createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date()
        }
      });
      
      if (user.createdAt.getTime() === new Date(userData.createdAt).getTime()) {
        usersCreated++;
      } else {
        usersUpdated++;
      }
    }
    console.log(`✅ ${usersCreated} utilisateurs créés, ${usersUpdated} mis à jour`);

    // 2. Importer les magasins
    console.log('\n🏪 Import des magasins...');
    let shopsCreated = 0;
    
    for (const shopData of exportData.shops) {
      await prisma.shop.upsert({
        where: { id: shopData.id },
        update: {
          name: shopData.name,
          address: shopData.address,
          city: shopData.city,
          postalCode: shopData.postalCode,
          phone: shopData.phone
        },
        create: {
          id: shopData.id,
          name: shopData.name,
          address: shopData.address,
          city: shopData.city,
          postalCode: shopData.postalCode,
          phone: shopData.phone,
          userId: shopData.userId
        }
      });
      shopsCreated++;
    }
    console.log(`✅ ${shopsCreated} magasins importés`);

    // 3. Importer les produits
    console.log('\n📦 Import des produits...');
    let productsCreated = 0;
    
    for (const productData of exportData.products) {
      await prisma.product.upsert({
        where: { id: productData.id },
        update: {
          name: productData.name,
          description: productData.description,
          priceHT: productData.priceHT,
          tvaRate: productData.tvaRate,
          unit: productData.unit,
          category: productData.category,
          subCategory: productData.subCategory,
          photoUrl: productData.photoUrl,
          isActive: productData.isActive,
          isVisibleToClients: productData.isVisibleToClients,
          stock: productData.stock,
          minStock: productData.minStock
        },
        create: {
          id: productData.id,
          name: productData.name,
          description: productData.description,
          priceHT: productData.priceHT,
          tvaRate: productData.tvaRate,
          unit: productData.unit,
          category: productData.category,
          subCategory: productData.subCategory,
          photoUrl: productData.photoUrl,
          isActive: productData.isActive,
          isVisibleToClients: productData.isVisibleToClients,
          stock: productData.stock,
          minStock: productData.minStock,
          createdAt: productData.createdAt ? new Date(productData.createdAt) : new Date()
        }
      });
      productsCreated++;
    }
    console.log(`✅ ${productsCreated} produits importés`);

    // 4. Importer les commandes
    console.log('\n📋 Import des commandes...');
    let ordersCreated = 0;
    
    for (const orderData of exportData.orders) {
      await prisma.order.upsert({
        where: { id: orderData.id },
        update: {
          status: orderData.status,
          totalHT: orderData.totalHT,
          totalTVA: orderData.totalTVA,
          totalTTC: orderData.totalTTC
        },
        create: {
          id: orderData.id,
          shopId: orderData.shopId,
          status: orderData.status,
          totalHT: orderData.totalHT,
          totalTVA: orderData.totalTVA,
          totalTTC: orderData.totalTTC,
          createdAt: orderData.createdAt ? new Date(orderData.createdAt) : new Date(),
          items: {
            create: orderData.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceHT: item.priceHT,
              totalHT: item.totalHT,
              totalTVA: item.totalTVA,
              totalTTC: item.totalTTC
            }))
          }
        }
      });
      ordersCreated++;
    }
    console.log(`✅ ${ordersCreated} commandes importées`);

    // 5. Importer les paiements
    console.log('\n💳 Import des paiements...');
    let paymentsCreated = 0;
    
    for (const paymentData of exportData.payments) {
      await prisma.payment.upsert({
        where: { id: paymentData.id },
        update: {
          amount: paymentData.amount,
          method: paymentData.method,
          status: paymentData.status
        },
        create: {
          id: paymentData.id,
          orderId: paymentData.orderId,
          amount: paymentData.amount,
          method: paymentData.method,
          status: paymentData.status,
          createdAt: paymentData.createdAt ? new Date(paymentData.createdAt) : new Date()
        }
      });
      paymentsCreated++;
    }
    console.log(`✅ ${paymentsCreated} paiements importés`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 IMPORT TERMINÉ AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`   - ${usersCreated + usersUpdated} utilisateurs`);
    console.log(`   - ${shopsCreated} magasins`);
    console.log(`   - ${productsCreated} produits`);
    console.log(`   - ${ordersCreated} commandes`);
    console.log(`   - ${paymentsCreated} paiements`);
    console.log('\n✅ Toutes les données ont été importées sur Render!\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importData();

