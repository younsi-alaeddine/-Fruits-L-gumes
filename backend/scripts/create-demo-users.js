require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Configuration des utilisateurs démo
const demoUsers = [
  {
    name: 'Administrateur Demo',
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'ADMIN',
    phone: '+33123456789'
  },
  {
    name: 'Client Demo',
    email: 'client@demo.com',
    password: 'client123',
    role: 'CLIENT',
    phone: '+33987654321',
    shop: {
      name: 'Épicerie Demo',
      address: '15 Rue de la République',
      city: 'Paris',
      postalCode: '75001',
      phone: '+33987654321'
    }
  },
  {
    name: 'Préparateur Demo',
    email: 'preparateur@demo.com',
    password: 'preparateur123',
    role: 'PREPARATEUR',
    phone: '+33987654322'
  },
  {
    name: 'Livreur Demo',
    email: 'livreur@demo.com',
    password: 'livreur123',
    role: 'LIVREUR',
    phone: '+33987654323'
  },
  {
    name: 'Commercial Demo',
    email: 'commercial@demo.com',
    password: 'commercial123',
    role: 'COMMERCIAL',
    phone: '+33987654324'
  },
  {
    name: 'Gestionnaire Stock Demo',
    email: 'stock@demo.com',
    password: 'stock123',
    role: 'STOCK_MANAGER',
    phone: '+33987654325'
  },
  {
    name: 'Finance Demo',
    email: 'finance@demo.com',
    password: 'finance123',
    role: 'FINANCE',
    phone: '+33987654326'
  },
  {
    name: 'Manager Demo',
    email: 'manager@demo.com',
    password: 'manager123',
    role: 'MANAGER',
    phone: '+33987654327'
  }
];

async function createDemoUsers() {
  try {
    console.log('🌱 Création des utilisateurs démo...\n');

    const createdUsers = [];
    const existingUsers = [];

    for (const userData of demoUsers) {
      try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
          include: { shop: true }
        });

        if (existingUser) {
          existingUsers.push({
            ...userData,
            user: existingUser
          });
          console.log(`⚠️  ${userData.role}: ${userData.email} existe déjà`);
          continue;
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Préparer les données de création
        const createData = {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          phone: userData.phone
        };

        // Si c'est un client, créer aussi le magasin
        if (userData.role === 'CLIENT' && userData.shop) {
          createData.shop = {
            create: userData.shop
          };
        }

        // Créer l'utilisateur
        const user = await prisma.user.create({
          data: createData,
          include: { shop: true }
        });

        createdUsers.push({
          ...userData,
          user
        });

        console.log(`✅ ${userData.role}: ${userData.email} créé avec succès`);
        if (userData.shop) {
          console.log(`   Magasin: ${user.shop?.name}`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors de la création de ${userData.email}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📋 RÉSUMÉ DES COMPTES DÉMO');
    console.log('='.repeat(70));
    
    if (createdUsers.length > 0) {
      console.log('\n✅ COMPTES CRÉÉS:\n');
      createdUsers.forEach(({ role, email, password, user }) => {
        console.log(`   ${role}:`);
        console.log(`   📧 Email: ${email}`);
        console.log(`   🔑 Mot de passe: ${password}`);
        if (user.shop) {
          console.log(`   🏪 Magasin: ${user.shop.name}`);
        }
        console.log('');
      });
    }

    if (existingUsers.length > 0) {
      console.log('\n⚠️  COMPTES EXISTANTS:\n');
      existingUsers.forEach(({ role, email, password }) => {
        console.log(`   ${role}: ${email} / ${password}`);
      });
      console.log('');
    }

    console.log('='.repeat(70));
    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🌐 Backend:  http://localhost:5000\n');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers();
