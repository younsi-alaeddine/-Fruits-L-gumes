const nodemailer = require('nodemailer');
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

console.log('🔍 Configuration SMTP:');
console.log('  Host:', process.env.SMTP_HOST);
console.log('  Port:', process.env.SMTP_PORT || '465');
console.log('  User:', process.env.SMTP_USER);
console.log('  Password: ***');
console.log('');

// Test 1: Vérifier la connexion SMTP
console.log('📡 Test 1: Vérification de la connexion SMTP...');
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ ERREUR de connexion SMTP:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Command:', error.command);
    if (error.response) {
      console.error('   Réponse serveur:', error.response);
    }
    process.exit(1);
  } else {
    console.log('✅ Connexion SMTP réussie !');
    console.log('');
    
    // Test 2: Envoyer un email de test
    console.log('📧 Test 2: Envoi d\'un email de test...');
    
    // Demander l'email de destination
    const testEmail = process.argv[2] || 'test@example.com';
    
    const mailOptions = {
      from: `"Distribution Fruits & Légumes" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: 'Test Email - Fruits & Légumes',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">🍎 Test Email</h2>
          <p>Bonjour,</p>
          <p>Ceci est un email de test pour vérifier que la configuration SMTP fonctionne correctement.</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <p><strong>Serveur:</strong> ${process.env.SMTP_HOST}</p>
          <p>Si vous recevez cet email, la configuration SMTP est opérationnelle ! ✅</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Distribution Fruits & Légumes - Système de gestion
          </p>
        </div>
      `,
      text: `
        Test Email - Fruits & Légumes
        
        Bonjour,
        
        Ceci est un email de test pour vérifier que la configuration SMTP fonctionne correctement.
        
        Date: ${new Date().toLocaleString('fr-FR')}
        Serveur: ${process.env.SMTP_HOST}
        
        Si vous recevez cet email, la configuration SMTP est opérationnelle ! ✅
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ ERREUR lors de l\'envoi de l\'email:');
        console.error('   Code:', error.code);
        console.error('   Message:', error.message);
        console.error('   Command:', error.command);
        if (error.response) {
          console.error('   Réponse serveur:', error.response);
        }
        process.exit(1);
      } else {
        console.log('✅ Email envoyé avec succès !');
        console.log('   Message ID:', info.messageId);
        console.log('   À:', testEmail);
        console.log('   Depuis:', process.env.SMTP_USER);
        console.log('');
        console.log('📬 Vérifiez votre boîte mail (et les spams) pour confirmer la réception.');
        process.exit(0);
      }
    });
  }
});
