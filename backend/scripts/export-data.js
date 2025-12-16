/**
 * Script pour exporter toutes les données de la base de données locale
 * Usage: node scripts/export-data.js
 * 
 * Crée un fichier JSON avec toutes les données exportées
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('📤 Début de l\'export des données...\n');

    // Exporter les utilisateurs (sans les mots de passe hashés)
    console.log('👤 Export des utilisateurs...');
    const users = await prisma.user.findMany({
      include: {
        shop: true
      }
    });
    
    // Séparer les utilisateurs avec leurs mots de passe (pour migration)
    const usersWithPasswords = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        password: true, // Inclure le hash du mot de passe
        role: true,
        phone: true,
        resetToken: true,
        resetTokenExpiry: true,
        deletedAt: true,
        createdAt: true
      }
    });

    console.log(`✅ ${users.length} utilisateurs exportés`);

    // Exporter les magasins
    console.log('🏪 Export des magasins...');
    const shops = await prisma.shop.findMany();
    console.log(`✅ ${shops.length} magasins exportés`);

    // Exporter les produits
    console.log('📦 Export des produits...');
    const products = await prisma.product.findMany();
    console.log(`✅ ${products.length} produits exportés`);

    // Exporter les commandes avec leurs items
    console.log('📋 Export des commandes...');
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        shop: true
      }
    });
    console.log(`✅ ${orders.length} commandes exportées`);

    // Exporter les paiements
    console.log('💳 Export des paiements...');
    const payments = await prisma.payment.findMany({
      include: {
        order: true
      }
    });
    console.log(`✅ ${payments.length} paiements exportés`);

    // Créer l'objet de données
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      users: usersWithPasswords,
      shops: shops,
      products: products,
      orders: orders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          priceHT: item.priceHT,
          totalHT: item.totalHT,
          totalTVA: item.totalTVA,
          totalTTC: item.totalTTC
        }))
      })),
      payments: payments
    };

    // Sauvegarder dans un fichier JSON
    const exportPath = path.join(__dirname, '..', 'data-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✅ EXPORT TERMINÉ AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log(`\n📁 Fichier créé: ${exportPath}`);
    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`   - ${users.length} utilisateurs`);
    console.log(`   - ${shops.length} magasins`);
    console.log(`   - ${products.length} produits`);
    console.log(`   - ${orders.length} commandes`);
    console.log(`   - ${payments.length} paiements`);
    console.log('\n💡 Utilisez scripts/import-data.js pour importer ces données sur Render\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();

