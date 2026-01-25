/**
 * Script de migration pour appliquer les nouveaux champs au schéma Prisma
 * 
 * À exécuter après avoir modifié le schema.prisma :
 * 1. npx prisma generate
 * 2. npx prisma migrate dev --name add_professional_order_fields
 * 
 * OU en production :
 * npx prisma migrate deploy
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Début de la migration...');

  try {
    // Les migrations Prisma gèrent automatiquement les changements de schéma
    // Ce script peut être utilisé pour migrer les données existantes si nécessaire
    
    console.log('✅ Migration terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
