const prisma = require('../config/database');
const { sendEmailVerificationEmail } = require('../utils/emailService');
require('dotenv').config();

async function resendVerificationEmail(email) {
  try {
    console.log('🔍 Recherche de l\'utilisateur...');
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error('❌ Utilisateur non trouvé avec cet email');
      return;
    }

    if (user.emailVerified) {
      console.log('✅ Cet email est déjà vérifié');
      return;
    }

    console.log('📧 Utilisateur trouvé:', user.name);
    console.log('   Email:', user.email);
    console.log('');

    // Générer un nouveau token
    const crypto = require('crypto');
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date();
    emailVerificationExpiry.setHours(emailVerificationExpiry.getHours() + 24);

    console.log('🔑 Génération d\'un nouveau token...');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpiry
      }
    });

    // Envoyer l'email
    const baseUrl = process.env.FRONTEND_URL || 'https://fatah-commander.cloud';
    const verificationUrl = `${baseUrl}/verify-email?token=${emailVerificationToken}`;

    console.log('📤 Envoi de l\'email de vérification...');
    console.log('   URL:', verificationUrl);
    console.log('');

    await sendEmailVerificationEmail(user.email, verificationUrl, user.name);

    console.log('✅ Email de vérification envoyé avec succès !');
    console.log('   À:', user.email);
    console.log('   Lien:', verificationUrl);
    console.log('');
    console.log('📬 Vérifiez votre boîte mail (et les spams) pour confirmer la réception.');

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    if (error.code) console.error('   Code:', error.code);
    if (error.command) console.error('   Command:', error.command);
    if (error.response) console.error('   Réponse:', error.response);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'email depuis les arguments
const email = process.argv[2];
if (!email) {
  console.error('❌ Usage: node resend-verification-email.js <email>');
  console.error('   Exemple: node resend-verification-email.js younsialaeddine@gmail.com');
  process.exit(1);
}

resendVerificationEmail(email);
