const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function generateCsrfToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    // Recherche de l'utilisateur dans la base de données
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          include: {
            organization: true,
            shopMemberships: {
              include: {
                shop: true
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Vérification si l'utilisateur est approuvé (pour les nouveaux comptes)
    if (!user.isApproved && user.role !== 'ADMIN') {
      return res.status(403).json({ 
        message: 'Votre compte est en attente d\'approbation par un administrateur',
        requiresAdminApproval: true
      });
    }

    // Récupération du clientId depuis les memberships si nécessaire
    let clientId = null;
    if (user.memberships && user.memberships.length > 0) {
      clientId = user.memberships[0].organizationId;
    }

    // Génération du token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        clientId: clientId,
        email: user.email 
      }, 
      JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const csrfToken = generateCsrfToken();
    res.cookie('csrfToken', csrfToken, { 
      httpOnly: false, 
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ 
      accessToken: token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        clientId: clientId,
        avatar: user.avatarUrl,
        emailVerified: user.emailVerified
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

const logout = async (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
};

const refresh = async (req, res) => {
  try {
    // Token refresh implementation
    const oldToken = req.headers.authorization?.split(' ')[1];
    if (!oldToken) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    try {
      const decoded = jwt.verify(oldToken, JWT_SECRET);
      const newToken = jwt.sign(
        { 
          id: decoded.id, 
          role: decoded.role, 
          clientId: decoded.clientId,
          email: decoded.email 
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );

      const csrfToken = generateCsrfToken();
      res.cookie('csrfToken', csrfToken, { 
        httpOnly: false, 
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 
      });

      // La partie frontend attend { accessToken, csrfToken }
      res.json({ accessToken: newToken, csrfToken });
    } catch (tokenError) {
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
  } catch (error) {
    // console.error('Refresh error:', error);
    res.status(401).json({ message: 'Token de rafraîchissement invalide' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        emailVerified: true,
        memberships: {
          include: {
            organization: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const clientId = user.memberships && user.memberships.length > 0 
      ? user.memberships[0].organizationId 
      : null;
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: clientId,
        avatar: user.avatarUrl,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('getCurrentUser error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ 
      where: { id: user.id }, 
      data: { password: hashedPassword } 
    });
    
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ message: 'Erreur lors du changement de mot de passe' });
  }
};

module.exports = {
  login,
  logout,
  refresh,
  getCurrentUser,
  changePassword,
};
