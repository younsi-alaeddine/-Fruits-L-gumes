const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultSettings = [
  // Général
  { key: 'company_name', value: 'Distribution Fruits & Légumes', type: 'string', category: 'general', description: 'Nom de l\'entreprise' },
  { key: 'company_address', value: '123 Rue des Fruits', type: 'string', category: 'general', description: 'Adresse de l\'entreprise' },
  { key: 'company_city', value: 'Paris', type: 'string', category: 'general', description: 'Ville' },
  { key: 'company_postal_code', value: '75000', type: 'string', category: 'general', description: 'Code postal' },
  { key: 'company_phone', value: '+33123456789', type: 'string', category: 'general', description: 'Téléphone' },
  { key: 'company_email', value: 'contact@fruits-legumes.fr', type: 'string', category: 'general', description: 'Email' },
  
  // Email
  { key: 'smtp_host', value: 'smtp.gmail.com', type: 'string', category: 'email', description: 'Serveur SMTP' },
  { key: 'smtp_port', value: '587', type: 'number', category: 'email', description: 'Port SMTP' },
  { key: 'smtp_secure', value: 'false', type: 'boolean', category: 'email', description: 'SMTP sécurisé' },
  { key: 'email_from', value: 'noreply@fruits-legumes.fr', type: 'string', category: 'email', description: 'Email expéditeur' },
  { key: 'email_notifications_enabled', value: 'true', type: 'boolean', category: 'email', description: 'Activer les notifications par email' },
  
  // Stock
  { key: 'default_stock_alert', value: '10', type: 'number', category: 'stock', description: 'Seuil d\'alerte stock par défaut' },
  { key: 'allow_negative_stock', value: 'false', type: 'boolean', category: 'stock', description: 'Autoriser les stocks négatifs' },
  
  // TVA
  { key: 'default_tva_rate', value: '5.5', type: 'number', category: 'tax', description: 'Taux de TVA par défaut (%)' },
  
  // Commandes
  { key: 'order_auto_generate_invoice', value: 'false', type: 'boolean', category: 'orders', description: 'Générer automatiquement les factures' },
  { key: 'order_min_amount', value: '0', type: 'number', category: 'orders', description: 'Montant minimum de commande' },
];

async function main() {
  console.log('Initialisation des paramètres par défaut...');
  
  for (const setting of defaultSettings) {
    try {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          type: setting.type,
          category: setting.category,
          description: setting.description,
        },
        create: setting,
      });
      console.log(`✓ Setting ${setting.key} initialisé`);
    } catch (error) {
      console.error(`✗ Erreur pour ${setting.key}:`, error.message);
    }
  }
  
  console.log('Initialisation terminée !');
}

main()
  .catch((e) => {
    console.error('Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
