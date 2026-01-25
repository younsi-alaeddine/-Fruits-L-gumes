require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('\n🔐 Réinitialisation mot de passe ADMIN...\n');

    const adminEmail = 'contact.carreprimeur@gmail.com';
    const newPassword = 'admin123';

    const admin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!admin) {
      console.error('❌ Aucun admin trouvé');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: adminEmail },
      data: { password: hashedPassword }
    });

    console.log('✅ Mot de passe réinitialisé !\n');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Mot de passe:', newPassword);
    console.log('\n⚠️  Changez-le après connexion !\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
