const prisma = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Script pour nettoyer la base de données
 * Conserve uniquement:
 * - Utilisateurs ADMIN
 * - Catégories
 * - Sous-catégories
 * - Produits
 */

async function cleanDatabase() {
  console.log('🧹 Début du nettoyage de la base de données...\n');

  try {
    // Compteurs
    let deletedCounts = {};

    // 1. Supprimer toutes les données liées aux commandes (en respectant les contraintes FK)
    console.log('📦 Suppression des données de commandes...');
    
    // Retours
    deletedCounts.returns = await prisma.return.deleteMany({});
    console.log(`   ✓ ${deletedCounts.returns.count} retours supprimés`);

    // Items de retour
    deletedCounts.returnItems = await prisma.returnItem.deleteMany({});
    console.log(`   ✓ ${deletedCounts.returnItems.count} items de retour supprimés`);

    // Avoirs (Credit Notes)
    deletedCounts.creditNotes = await prisma.creditNote.deleteMany({});
    console.log(`   ✓ ${deletedCounts.creditNotes.count} avoirs supprimés`);

    // Paiements
    deletedCounts.payments = await prisma.payment.deleteMany({});
    console.log(`   ✓ ${deletedCounts.payments.count} paiements supprimés`);

    // Factures
    deletedCounts.invoices = await prisma.invoice.deleteMany({});
    console.log(`   ✓ ${deletedCounts.invoices.count} factures supprimées`);

    // Livraisons
    deletedCounts.deliveries = await prisma.delivery.deleteMany({});
    console.log(`   ✓ ${deletedCounts.deliveries.count} livraisons supprimées`);

    // Items de commande
    deletedCounts.orderItems = await prisma.orderItem.deleteMany({});
    console.log(`   ✓ ${deletedCounts.orderItems.count} items de commande supprimés`);

    // Commandes
    deletedCounts.orders = await prisma.order.deleteMany({});
    console.log(`   ✓ ${deletedCounts.orders.count} commandes supprimées`);

    // Items de devis
    deletedCounts.quoteItems = await prisma.quoteItem.deleteMany({});
    console.log(`   ✓ ${deletedCounts.quoteItems.count} items de devis supprimés`);

    // Devis
    deletedCounts.quotes = await prisma.quote.deleteMany({});
    console.log(`   ✓ ${deletedCounts.quotes.count} devis supprimés`);

    // Items de commandes récurrentes
    deletedCounts.recurringItems = await prisma.recurringItem.deleteMany({});
    console.log(`   ✓ ${deletedCounts.recurringItems.count} items de commandes récurrentes supprimés`);

    // Commandes récurrentes
    deletedCounts.recurringOrders = await prisma.recurringOrder.deleteMany({});
    console.log(`   ✓ ${deletedCounts.recurringOrders.count} commandes récurrentes supprimées`);

    // 2. Supprimer les données de stock
    console.log('\n📊 Suppression des données de stock...');
    deletedCounts.shopStocks = await prisma.shopStock.deleteMany({});
    console.log(`   ✓ ${deletedCounts.shopStocks.count} stocks de magasins supprimés`);

    // 3. Supprimer les données de tarification
    console.log('\n💰 Suppression des données de tarification...');
    deletedCounts.clientPricing = await prisma.clientPricing.deleteMany({});
    console.log(`   ✓ ${deletedCounts.clientPricing.count} tarifs clients supprimés`);

    deletedCounts.volumePricing = await prisma.volumePricing.deleteMany({});
    console.log(`   ✓ ${deletedCounts.volumePricing.count} tarifs dégressifs supprimés`);

    deletedCounts.priceHistory = await prisma.priceHistory.deleteMany({});
    console.log(`   ✓ ${deletedCounts.priceHistory.count} historiques de prix supprimés`);

    // 4. Supprimer les données de fournisseurs
    console.log('\n🏭 Suppression des données de fournisseurs...');
    deletedCounts.supplierDocuments = await prisma.supplierDocument.deleteMany({});
    console.log(`   ✓ ${deletedCounts.supplierDocuments.count} documents fournisseurs supprimés`);

    deletedCounts.supplierEvaluations = await prisma.supplierEvaluation.deleteMany({});
    console.log(`   ✓ ${deletedCounts.supplierEvaluations.count} évaluations fournisseurs supprimées`);

    deletedCounts.supplierOrderItems = await prisma.supplierOrderItem.deleteMany({});
    console.log(`   ✓ ${deletedCounts.supplierOrderItems.count} items de commandes fournisseurs supprimés`);

    deletedCounts.supplierOrders = await prisma.supplierOrder.deleteMany({});
    console.log(`   ✓ ${deletedCounts.supplierOrders.count} commandes fournisseurs supprimées`);

    deletedCounts.supplierProducts = await prisma.supplierProduct.deleteMany({});
    console.log(`   ✓ ${deletedCounts.supplierProducts.count} produits fournisseurs supprimés`);

    deletedCounts.suppliers = await prisma.supplier.deleteMany({});
    console.log(`   ✓ ${deletedCounts.suppliers.count} fournisseurs supprimés`);

    // 5. Supprimer les autres données
    console.log('\n📋 Suppression des autres données...');
    
    deletedCounts.promotions = await prisma.promotion.deleteMany({});
    console.log(`   ✓ ${deletedCounts.promotions.count} promotions supprimées`);

    deletedCounts.messages = await prisma.message.deleteMany({});
    console.log(`   ✓ ${deletedCounts.messages.count} messages supprimés`);

    deletedCounts.notifications = await prisma.notification.deleteMany({});
    console.log(`   ✓ ${deletedCounts.notifications.count} notifications supprimées`);

    deletedCounts.auditLogs = await prisma.auditLog.deleteMany({});
    console.log(`   ✓ ${deletedCounts.auditLogs.count} logs d'audit supprimés`);

    deletedCounts.internalMessages = await prisma.internalMessage.deleteMany({});
    console.log(`   ✓ ${deletedCounts.internalMessages.count} messages internes supprimés`);

    deletedCounts.orderDeadlines = await prisma.orderDeadline.deleteMany({});
    console.log(`   ✓ ${deletedCounts.orderDeadlines.count} délais de commande supprimés`);

    deletedCounts.invoiceTemplates = await prisma.invoiceTemplate.deleteMany({});
    console.log(`   ✓ ${deletedCounts.invoiceTemplates.count} modèles de facture supprimés`);

    // 6. Supprimer les magasins (sauf ceux liés aux admins si nécessaire)
    console.log('\n🏪 Suppression des magasins...');
    deletedCounts.shopMemberships = await prisma.shopMembership.deleteMany({});
    console.log(`   ✓ ${deletedCounts.shopMemberships.count} membres de magasins supprimés`);

    deletedCounts.shops = await prisma.shop.deleteMany({});
    console.log(`   ✓ ${deletedCounts.shops.count} magasins supprimés`);

    // 7. Supprimer les organisations et membres
    console.log('\n🏢 Suppression des organisations...');
    deletedCounts.memberships = await prisma.membership.deleteMany({});
    console.log(`   ✓ ${deletedCounts.memberships.count} membres d'organisations supprimés`);

    deletedCounts.organizations = await prisma.organization.deleteMany({});
    console.log(`   ✓ ${deletedCounts.organizations.count} organisations supprimées`);

    // 8. Supprimer les rôles et permissions
    console.log('\n🔐 Suppression des rôles et permissions...');
    deletedCounts.rolePermissions = await prisma.rolePermission.deleteMany({});
    console.log(`   ✓ ${deletedCounts.rolePermissions.count} permissions de rôles supprimées`);

    deletedCounts.permissions = await prisma.permission.deleteMany({});
    console.log(`   ✓ ${deletedCounts.permissions.count} permissions supprimées`);

    deletedCounts.roleAssignments = await prisma.roleAssignment.deleteMany({});
    console.log(`   ✓ ${deletedCounts.roleAssignments.count} assignations de rôles supprimées`);

    // 9. Supprimer les utilisateurs NON-ADMIN
    console.log('\n👥 Suppression des utilisateurs non-admin...');
    const nonAdminUsers = await prisma.user.deleteMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      }
    });
    deletedCounts.nonAdminUsers = nonAdminUsers.count;
    console.log(`   ✓ ${deletedCounts.nonAdminUsers.count} utilisateurs non-admin supprimés`);

    // 10. Vérifier et afficher ce qui reste
    console.log('\n✅ Vérification des données conservées...\n');

    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true, role: true }
    });
    console.log(`👤 Utilisateurs ADMIN conservés: ${adminUsers.length}`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    const categories = await prisma.category.findMany({
      select: { id: true, name: true, isActive: true }
    });
    console.log(`\n📁 Catégories conservées: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} ${cat.isActive ? '(active)' : '(inactive)'}`);
    });

    const subCategories = await prisma.subCategory.findMany({
      select: { id: true, name: true, categoryId: true }
    });
    console.log(`\n📂 Sous-catégories conservées: ${subCategories.length}`);

    const products = await prisma.product.findMany({
      select: { id: true, name: true, isActive: true }
    });
    console.log(`\n🍎 Produits conservés: ${products.length}`);

    const settings = await prisma.setting.findMany({
      select: { key: true }
    });
    console.log(`\n⚙️  Paramètres conservés: ${settings.length}`);

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DU NETTOYAGE');
    console.log('='.repeat(60));
    
    const totalDeleted = Object.values(deletedCounts).reduce((sum, item) => {
      const count = typeof item === 'object' && item.count !== undefined ? item.count : (typeof item === 'number' ? item : 0);
      return sum + count;
    }, 0);
    console.log(`\n✅ Total d'enregistrements supprimés: ${totalDeleted}`);
    console.log(`\n✅ Données conservées:`);
    console.log(`   - ${adminUsers.length} utilisateur(s) ADMIN`);
    console.log(`   - ${categories.length} catégorie(s)`);
    console.log(`   - ${subCategories.length} sous-catégorie(s)`);
    console.log(`   - ${products.length} produit(s)`);
    console.log(`   - ${settings.length} paramètre(s)`);
    
    console.log('\n✨ Nettoyage terminé avec succès!\n');

  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  cleanDatabase()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { cleanDatabase };
