require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔄 Création de l\'administrateur...');
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' }
    });
    
    if (existingAdmin) {
      console.log('✅ L\'administrateur existe déjà!');
      console.log('📧 Email: admin@demo.com');
      console.log('🔑 Mot de passe: admin123');
      await prisma.$disconnect();
      return;
    }
    
    // Hasher le mot de passe
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    // Créer l'admin
    const admin = await prisma.user.create({
      data: {
        name: 'Administrateur Demo',
        email: 'admin@demo.com',
        password: adminPassword,
        role: 'ADMIN',
        phone: '+33123456789'
      }
    });
    
    console.log('✅ Administrateur créé avec succès!');
    console.log('📧 Email: admin@demo.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('🆔 ID:', admin.id);
    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
