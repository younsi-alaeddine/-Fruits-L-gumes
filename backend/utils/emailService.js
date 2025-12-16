const nodemailer = require('nodemailer');
const logger = require('./logger');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Vérifier la configuration email
 */
transporter.verify((error, success) => {
  if (error) {
    logger.warn('Configuration email non disponible', { error: error.message });
  } else {
    logger.info('Service email configuré avec succès');
  }
});

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
const sendPasswordResetEmail = async (email, resetUrl, userName) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    logger.warn('Configuration email manquante - Email non envoyé', { email });
    return; // En développement, on peut continuer sans email
  }

  const mailOptions = {
    from: `"Distribution Fruits & Légumes" <${process.env.SMTP_USER}>`,
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
    await transporter.sendMail(mailOptions);
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

module.exports = {
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusChangeEmail,
};

