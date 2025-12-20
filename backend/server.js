const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

dotenv.config();

// Démarrer les jobs cron
if (process.env.ENABLE_JOBS !== 'false') {
  require('./jobs/recurring-orders');
}

const app = express();
const PORT = process.env.PORT || 5000;
const logger = require('./utils/logger');

// Pour le déploiement sur Render/Railway, écouter sur 0.0.0.0
const HOST = process.env.HOST || '0.0.0.0';

// Trust proxy - Nécessaire pour Render et autres plateformes avec proxy
app.set('trust proxy', true);

// ==================== SÉCURITÉ ====================
// Helmet - Sécurité des headers HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:5000", "https:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Compression
app.use(compression());

// Rate Limiting général
const { generalLimiter } = require('./middleware/rateLimiter');
app.use('/api/', generalLimiter);

// Sanitization
const { sanitizeMongo, sanitizeRequest } = require('./middleware/sanitize');
app.use(sanitizeMongo);
app.use(sanitizeRequest);

// ==================== MIDDLEWARE STANDARD ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (photos produits) avec headers CORS
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// ==================== DOCUMENTATION SWAGGER ====================
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Documentation - Distribution Fruits & Légumes',
}));

// ==================== ROUTES ====================
// Rate limiters spécifiques
const { authLimiter, orderLimiter } = require('./middleware/rateLimiter');

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', orderLimiter, require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/shops', require('./routes/shops'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/recurring-orders', require('./routes/recurring-orders'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/client/finance', require('./routes/client-finance'));

// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Distribution Fruits & Légumes',
    version: '1.0.0',
    status: 'online',
    api: '/api',
    docs: '/api-docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      admin: '/api/admin',
      shops: '/api/shops',
      stock: '/api/stock',
      payments: '/api/payments',
      notifications: '/api/notifications',
      invoices: '/api/invoices',
      'recurring-orders': '/api/recurring-orders',
      promotions: '/api/promotions',
      deliveries: '/api/deliveries',
      settings: '/api/settings',
      messages: '/api/messages',
      reports: '/api/reports',
      docs: '/api-docs'
    },
    timestamp: new Date().toISOString()
  });
});

// Route racine de l'API
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API Distribution Fruits & Légumes',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      admin: '/api/admin',
      shops: '/api/shops',
      stock: '/api/stock',
      payments: '/api/payments',
      notifications: '/api/notifications',
      invoices: '/api/invoices',
      'recurring-orders': '/api/recurring-orders',
      promotions: '/api/promotions',
      deliveries: '/api/deliveries',
      settings: '/api/settings',
      messages: '/api/messages',
      reports: '/api/reports',
      docs: '/api-docs'
    },
    timestamp: new Date().toISOString()
  });
});

// Route temporaire pour créer l'admin (À SUPPRIMER APRÈS UTILISATION)
// Fonctionne avec GET ou POST - Pas besoin de Shell Render !
app.get('/api/create-admin', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcrypt');
    const prisma = new PrismaClient();
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@demo.com' }
    });
    
    if (existingAdmin) {
      await prisma.$disconnect();
      return res.json({
        success: true,
        message: 'Admin existe déjà',
        email: 'admin@demo.com',
        password: 'admin123',
        note: 'Vous pouvez vous connecter avec ces identifiants'
      });
    }
    
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Administrateur Demo',
        email: 'admin@demo.com',
        password: adminPassword,
        role: 'ADMIN',
        phone: '+33123456789'
      }
    });
    
    await prisma.$disconnect();
    
    res.json({
      success: true,
      message: 'Admin créé avec succès',
      email: 'admin@demo.com',
      password: 'admin123',
      note: 'Connectez-vous maintenant avec ces identifiants',
      warning: '⚠️ Supprimez cette route après utilisation pour la sécurité!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création',
      error: error.message
    });
  }
});

app.post('/api/create-admin', async (req, res) => {
  // Rediriger vers GET
  return res.redirect(307, '/api/create-admin');
});

// Route de santé améliorée
app.get('/api/health', async (req, res) => {
  try {
    const prisma = require('./config/database');
    // Vérifier la connexion à la base de données
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'OK',
      message: 'API fonctionnelle',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'ERROR',
      message: 'Service indisponible',
      database: 'disconnected',
    });
  }
});

// ==================== GESTION DES ERREURS ====================
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Route non trouvée
app.use(notFoundHandler);

// Gestionnaire d'erreurs global
app.use(errorHandler);

// ==================== DÉMARRAGE ====================
app.listen(PORT, HOST, () => {
  logger.info(`🚀 Serveur démarré sur ${HOST}:${PORT}`, {
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development',
  });
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', async () => {
  logger.info('SIGTERM reçu, arrêt gracieux...');
  const prisma = require('./config/database');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT reçu, arrêt gracieux...');
  const prisma = require('./config/database');
  await prisma.$disconnect();
  process.exit(0);
});

