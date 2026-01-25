/**
 * Script d'initialisation des données de contexte de commande
 * - Heures limites de commande
 * - Messages internes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initOrderContext() {
  console.log('🚀 Initialisation du contexte de commande...');

  try {
    // 1. Créer les heures limites de commande
    console.log('📅 Création des heures limites...');
    
    // Vérifier si des deadlines existent déjà
    const existingDeadlines = await prisma.orderDeadline.findMany();
    
    if (existingDeadlines.length === 0) {
      // Deadline générale : 18h00 tous les jours
      await prisma.orderDeadline.create({
        data: {
          dayOfWeek: null, // Tous les jours
          deadlineHour: 18,
          deadlineMinute: 0,
          isActive: true
        }
      });
      
      console.log('✅ Heure limite générale créée : 18h00');
    } else {
      console.log('ℹ️  Des heures limites existent déjà');
    }

    // 2. Créer des messages internes d'exemple
    console.log('📢 Création des messages internes...');
    
    const existingMessages = await prisma.internalMessage.findMany();
    
    if (existingMessages.length === 0) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Message d'information
      await prisma.internalMessage.create({
        data: {
          title: 'Bienvenue',
          content: 'Système de commande professionnel activé',
          type: 'info',
          priority: 0,
          isActive: true,
          validFrom: now,
          validTo: tomorrow
        }
      });
      
      // Message promotionnel
      await prisma.internalMessage.create({
        data: {
          title: 'Promotion du jour',
          content: 'Profitez de nos promotions sur les fruits de saison !',
          type: 'promo',
          priority: 1,
          isActive: true,
          validFrom: now,
          validTo: tomorrow
        }
      });
      
      console.log('✅ Messages internes créés');
    } else {
      console.log('ℹ️  Des messages existent déjà');
    }

    console.log('✅ Initialisation terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  initOrderContext();
}

module.exports = { initOrderContext };
