const nodemailer = require('nodemailer');
const prisma = require('../config/database');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// SECURITY: No hardcoded credentials. Use .env (SMTP_HOST, SMTP_USER, SMTP_PASSWORD).
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
  console.error('❌ SMTP non configuré. Définissez SMTP_HOST, SMTP_USER, SMTP_PASSWORD dans backend/.env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function testForgotPassword(email) {
  try {
    console.log('🔍 Test de récupération de mot de passe');
    console.log('   Email:', email);
    console.log('');

    // 1. Vérifier si l'utilisateur existe
    console.log('📋 Étape 1: Vérification de l\'utilisateur...');
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé avec cet email');
      return;
    }

    console.log('✅ Utilisateur trouvé:', user.name);
    console.log('');

    // 2. Vérifier la connexion SMTP
    console.log('📡 Étape 2: Vérification de la connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP OK');
    console.log('');

    // 3. Générer un token de test
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // 4. Envoyer l'email
    console.log('📧 Étape 3: Envoi de l\'email de réinitialisation...');
    const mailOptions = {
      from: `"Distribution Fruits & Légumes" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Réinitialisation de mot de passe</h2>
          <p>Bonjour ${user.name},</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p>Ce lien est valide pendant 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Distribution Fruits & Légumes - Système de gestion
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès !');
    console.log('   Message ID:', info.messageId);
    console.log('   À:', email);
    console.log('   Lien de réinitialisation:', resetUrl);
    console.log('');
    console.log('📬 Vérifiez votre boîte mail pour confirmer la réception.');

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
  console.error('❌ Usage: node test-forgot-password.js <email>');
  console.error('   Exemple: node test-forgot-password.js contact.carreprimeur@gmail.com');
  process.exit(1);
}

testForgotPassword(email);
