const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin existe déjà!');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        shop: {
          create: {
            name: 'Administration',
            address: 'Siège social',
            phone: '0000000000'
          }
        }
      },
      include: {
        shop: true
      }
    });
    
    console.log('✅ Admin créé avec succès!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('⚠️  Changez le mot de passe après la première connexion!');
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

