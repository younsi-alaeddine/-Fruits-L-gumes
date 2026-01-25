const nodemailer = require('nodemailer');
const logger = require('./logger');

// Configuration du transporteur email (production-ready)
// IMPORTANT: ne jamais embarquer d'identifiants SMTP en dur.
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE !== 'false'; // true par défaut (465)
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;

let transporter = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
} else {
  logger.warn('SMTP non configuré (SMTP_HOST/SMTP_USER/SMTP_PASSWORD manquants) - Emails désactivés');
}

/**
 * Vérifier la configuration email
 */
if (transporter) {
  transporter.verify((error) => {
    if (error) {
      logger.warn('Configuration email non disponible', { error: error.message });
    } else {
      logger.info('Service email configuré avec succès');
    }
  });
}

const ensureTransporter = () => {
  if (!transporter) {
    const msg = 'Service email non configuré';
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    }
    logger.warn(msg);
    return null;
  }
  return transporter;
};

/** SECURITY: No hardcoded SMTP credentials. Use SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env only. */

/**
 * Envoyer un email générique (utilisé par /api/emails)
 */
const sendEmail = async ({ to, subject, html, text, from }) => {
  const t = ensureTransporter();
  if (!t) return { disabled: true };

  const mailOptions = {
    from: from || `"Distribution Fruits & Légumes" <${SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  };

  const info = await t.sendMail(mailOptions);
  return { messageId: info.messageId };
};

/**
 * Tester la connexion SMTP + envoi d'un email test
 */
const testEmailConnection = async (to) => {
  const t = ensureTransporter();
  if (!t) return { disabled: true };
  await t.verify();
  return await sendEmail({
    to,
    subject: 'Test SMTP - Distribution Fruits & Légumes',
    html: '<p>✅ Test SMTP OK</p>',
    text: 'Test SMTP OK',
  });
};

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
const sendPasswordResetEmail = async (email, resetUrl, userName) => {
  const t = ensureTransporter();
  if (!t) return;

  const mailOptions = {
    from: `"Distribution Fruits & Légumes" <${SMTP_USER}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Réinitialisation de mot de passe</h2>
        <p>Bonjour ${userName},</p>
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
    text: `
      Réinitialisation de mot de passe
      
      Bonjour ${userName},
      
      Vous avez demandé à réinitialiser votre mot de passe.
      Cliquez sur le lien suivant : ${resetUrl}
      
      Ce lien est valide pendant 1 heure.
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
    `,
  };

  try {
    await t.sendMail(mailOptions);
    logger.info('Email de réinitialisation envoyé', { email });
  } catch (error) {
    logger.error('Erreur envoi email réinitialisation', {
      error: error.message,
      email,
    });
    throw error;
  }
};

/**
 * Envoyer un email de confirmation de commande
 */
const sendOrderConfirmationEmail = async (email, userName, order) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    logger.warn('Configuration email manquante - Email non envoyé', { email });
    return;
  }

  const mailOptions = {
    from: `"Distribution Fruits & Légumes" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Confirmation de commande #${order.id.substring(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Confirmation de commande</h2>
        <p>Bonjour ${userName},</p>
        <p>Votre commande a été créée avec succès.</p>
        <p><strong>Numéro de commande :</strong> ${order.id.substring(0, 8)}</p>
        <p><strong>Date :</strong> ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
        <p><strong>Total TTC :</strong> ${order.totalTTC.toFixed(2)} €</p>
        <p>Merci pour votre commande !</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Distribution Fruits & Légumes - Système de gestion
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Email de confirmation de commande envoyé', { email, orderId: order.id });
  } catch (error) {
    logger.error('Erreur envoi email confirmation commande', {
      error: error.message,
      email,
    });
  }
};

/**
 * Envoyer un email de notification de changement de statut de commande
 */
const sendOrderStatusChangeEmail = async (email, userName, order, oldStatus, newStatus) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    logger.warn('Configuration email manquante - Email non envoyé', { email });
    return;
  }

  const statusLabels = {
    NEW: 'Nouvelle',
    PREPARATION: 'En préparation',
    LIVRAISON: 'En livraison',
    LIVREE: 'Livrée',
    ANNULEE: 'Annulée',
  };

  const mailOptions = {
    from: `"Distribution Fruits & Légumes" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Mise à jour de votre commande #${order.id.substring(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Mise à jour de votre commande</h2>
        <p>Bonjour ${userName},</p>
        <p>Le statut de votre commande a été mis à jour.</p>
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
          <p><strong>Numéro de commande :</strong> ${order.id.substring(0, 8)}</p>
          <p><strong>Ancien statut :</strong> ${statusLabels[oldStatus] || oldStatus}</p>
          <p><strong>Nouveau statut :</strong> <span style="color: #28a745; font-weight: bold;">${statusLabels[newStatus] || newStatus}</span></p>
          <p><strong>Total TTC :</strong> ${order.totalTTC.toFixed(2)} €</p>
        </div>
        <p>Vous pouvez consulter les détails de votre commande dans votre espace client.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Distribution Fruits & Légumes - Système de gestion
        </p>
      </div>
    `,
    text: `
      Mise à jour de votre commande
      
      Bonjour ${userName},
      
      Le statut de votre commande #${order.id.substring(0, 8)} a été mis à jour.
      Ancien statut : ${statusLabels[oldStatus] || oldStatus}
      Nouveau statut : ${statusLabels[newStatus] || newStatus}
      
      Total TTC : ${order.totalTTC.toFixed(2)} €
      
      Vous pouvez consulter les détails dans votre espace client.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Email de changement de statut envoyé', { email, orderId: order.id });
  } catch (error) {
    logger.error('Erreur envoi email changement statut', {
      error: error.message,
      email,
    });
    throw error;
  }
};

/**
 * Envoyer un email de confirmation d'inscription
 */
const sendEmailVerificationEmail = async (email, verificationUrl, userName) => {
  const t = ensureTransporter();
  if (!t) {
    logger.warn('Email de vérification non envoyé (SMTP non configuré)', { email });
    throw new Error('Service email non configuré. Définir SMTP_HOST, SMTP_USER, SMTP_PASSWORD dans .env');
  }
  const smtpUser = process.env.SMTP_USER;

  const mailOptions = {
    from: `"Distribution Fruits & Légumes" <${smtpUser}>`,
    to: email,
    subject: 'Confirmez votre adresse email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">🍎 Bienvenue chez Fruits & Légumes !</h2>
        <p>Bonjour ${userName},</p>
        <p>Merci de vous être inscrit sur notre plateforme de commande.</p>
        <p>Pour finaliser votre inscription et accéder à votre espace client, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Confirmer mon email
          </a>
        </p>
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; color: #666; font-size: 12px;">${verificationUrl}</p>
        <p><strong>Ce lien est valide pendant 24 heures.</strong></p>
        <p>Si vous n'avez pas créé de compte, ignorez cet email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Distribution Fruits & Légumes - Système de gestion<br>
          Si vous avez des questions, contactez-nous à ${process.env.SMTP_USER}
        </p>
      </div>
    `,
    text: `
      Confirmation d'inscription
      
      Bonjour ${userName},
      
      Merci de vous être inscrit sur notre plateforme de commande.
      Pour finaliser votre inscription, veuillez confirmer votre adresse email en cliquant sur ce lien :
      
      ${verificationUrl}
      
      Ce lien est valide pendant 24 heures.
      Si vous n'avez pas créé de compte, ignorez cet email.
    `,
  };

  try {
    await t.sendMail(mailOptions);
    logger.info('Email de confirmation envoyé', { email });
  } catch (err) {
    logger.error('Erreur envoi email de vérification', { error: err.message, email });
    throw new Error(err.message || 'Erreur lors de l\'envoi de l\'email de vérification');
  }
};

const sendAccountApprovedEmail = async (email, userName) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    logger.warn('Configuration email manquante - Email non envoyé', { email });
    return;
  }

  const baseUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';
  const loginUrl = `${baseUrl}/login`;

  const mailOptions = {
    from: `"Distribution Fruits & Légumes" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Votre compte a été approuvé',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">✅ Votre compte a été approuvé !</h2>
        <p>Bonjour ${userName},</p>
        <p>Nous avons le plaisir de vous informer que votre compte a été approuvé par un administrateur.</p>
        <p>Vous pouvez maintenant vous connecter à votre espace client et commencer à passer vos commandes.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Se connecter
          </a>
        </p>
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; color: #666; font-size: 12px;">${loginUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Distribution Fruits & Légumes - Système de gestion<br>
          Si vous avez des questions, contactez-nous à ${process.env.SMTP_USER}
        </p>
      </div>
    `,
    text: `
      Votre compte a été approuvé
      
      Bonjour ${userName},
      
      Votre compte a été approuvé par un administrateur.
      Vous pouvez maintenant vous connecter à votre espace client :
      
      ${loginUrl}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Email d\'approbation envoyé', { email });
  } catch (error) {
    logger.error('Erreur envoi email d\'approbation', {
      error: error.message,
      email,
    });
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusChangeEmail,
  sendEmailVerificationEmail,
  sendAccountApprovedEmail,
};

