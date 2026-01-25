const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'contact.carreprimeur@gmail.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin existe déjà!');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        name: 'Administrateur',
        email: 'contact.carreprimeur@gmail.com',
        password: hashedPassword,
        role: 'ADMIN',
        shop: {
          create: {
            name: 'Administration',
            address: 'Siège social',
            city: 'Paris',
            postalCode: '75001',
            phone: '0000000000'
          }
        }
      },
      include: {
        shop: true
      }
    });
    
    console.log('✅ Admin créé avec succès!');
    console.log('Email: contact.carreprimeur@gmail.com');
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

