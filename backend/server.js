const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');

dotenv.config();

// Démarrer les jobs cron
if (process.env.ENABLE_JOBS !== 'false') {
  require('./jobs/recurring-orders');
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const logger = require('./utils/logger');

// Pour le déploiement sur Render/Railway, écouter sur 0.0.0.0
const HOST = process.env.HOST || '0.0.0.0';

// Trust proxy - Configuration sécurisée pour éviter le contournement du rate limiting
// En production, spécifier uniquement les IPs du proxy (ex: Render, Railway, etc.)
if (process.env.NODE_ENV === 'production') {
  // Si PROXY_IPS est défini, utiliser ces IPs spécifiques
  // Sinon, ne faire confiance qu'au premier proxy (plus sécurisé)
  const proxyIPs = process.env.PROXY_IPS ? process.env.PROXY_IPS.split(',') : undefined;
  if (proxyIPs) {
    app.set('trust proxy', proxyIPs);
  } else {
    // Faire confiance uniquement au premier proxy (1 = premier proxy)
    app.set('trust proxy', 1);
  }
} else {
  // En développement, rester compatible avec express-rate-limit (évite trust proxy = true)
  // Si besoin, ajuster via PROXY_IPS ou basculer NODE_ENV=production.
  app.set('trust proxy', 1);
}

// ==================== SÉCURITÉ ====================
const helmetOptions = {
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
};
if (process.env.NODE_ENV === 'production') {
  helmetOptions.hsts = { maxAge: 31536000, includeSubDomains: true, preload: true };
}
app.use(helmet(helmetOptions));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ==================== SOCKET.IO (NOTIFICATIONS TEMPS RÉEL) ====================
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Auth Socket.io via JWT access token
io.use((socket, next) => {
  try {
    const token = socket.handshake?.auth?.token;
    if (!token) return next(new Error('Token manquant'));

    const { verifyToken } = require('./utils/jwt');
    const decoded = verifyToken(token);
    if (!decoded?.userId || decoded?.type !== 'access') {
      return next(new Error('Token invalide'));
    }

    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Token invalide'));
  }
});

io.on('connection', (socket) => {
  logger.info('Socket connecté', { userId: socket.userId, socketId: socket.id });
  socket.join(`user:${socket.userId}`);

  socket.on('disconnect', (reason) => {
    logger.info('Socket déconnecté', { userId: socket.userId, socketId: socket.id, reason });
  });

  socket.on('error', (err) => {
    logger.warn('Socket error', { userId: socket.userId, socketId: socket.id, error: String(err) });
  });
});

// Compression
app.use(compression());

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Rate Limiting général
const { generalLimiter } = require('./middleware/rateLimiter');
app.use('/api/', generalLimiter);

// Sanitization MongoDB (peut s'exécuter avant le body parser)
const { sanitizeMongo } = require('./middleware/sanitize');
app.use(sanitizeMongo);

// ==================== MIDDLEWARE STANDARD ====================
// Body parser JSON - DOIT être avant sanitizeRequest
app.use(express.json({ 
  limit: '10mb',
  strict: false, // Permet des valeurs non-objets (null, string, etc.)
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitization XSS (après le body parser pour avoir accès à req.body parsé)
const { sanitizeRequest } = require('./middleware/sanitize');
app.use(sanitizeRequest);

// Middleware pour gérer les erreurs de parsing JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn('Erreur parsing JSON', {
      path: req.path,
      method: req.method,
      error: err.message,
      contentType: req.headers['content-type'],
    });
    return res.status(400).json({
      success: false,
      message: 'Format de données invalide. Les données doivent être au format JSON valide.',
    });
  }
  next(err);
});

// Servir les fichiers statiques (photos produits). CORS aligned with app CORS (no wildcard).
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', frontendOrigin);
  }
}));

// ==================== DOCUMENTATION SWAGGER ====================
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Documentation - Distribution Fruits & Légumes',
  }));
}

// ==================== HTTPS REDIRECT (PRODUCTION) ====================
const { httpsRedirect } = require('./middleware/httpsRedirect');
app.use(httpsRedirect);

// ==================== DENY-BY-DEFAULT (API) ====================
const { denyByDefault } = require('./middleware/denyByDefault');
app.use(denyByDefault);

// ==================== ROUTES ====================
// Rate limiters spécifiques
const { authLimiter, orderLimiter } = require('./middleware/rateLimiter');

// Avatar (monté avant /api/auth)
app.use('/api/auth/avatar', authLimiter, require('./routes/avatar'));
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/prices', require('./routes/prices'));
app.use('/api/suppliers', require('./routes/suppliers'));
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
app.use('/api/returns', require('./routes/returns'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/client/finance', require('./routes/client-finance'));
app.use('/api/client/shops', require('./routes/client-shops'));
app.use('/api/manager', require('./routes/manager'));
app.use('/api/search', require('./routes/search'));
app.use('/api/order-context', require('./routes/order-context'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/emails', require('./routes/emails'));

const isProd = process.env.NODE_ENV === 'production';

app.get('/', (req, res) => {
  const base = {
    success: true,
    message: 'API Distribution Fruits & Légumes',
    version: '1.0.0',
    status: 'online',
    api: '/api',
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
    },
    timestamp: new Date().toISOString(),
  };
  if (!isProd) base.docs = '/api-docs';
  if (!isProd) base.endpoints.docs = '/api-docs';
  res.json(base);
});

app.get('/api', (req, res) => {
  const base = {
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
    },
    timestamp: new Date().toISOString(),
  };
  if (!isProd) base.endpoints.docs = '/api-docs';
  res.json(base);
});

// SECURITY: /api/create-admin disabled in production. Use scripts/create-admin.js.
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/create-admin', async (req, res) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const bcrypt = require('bcrypt');
      const prisma = new PrismaClient();
      const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@demo.com' } });
      if (existingAdmin) {
        await prisma.$disconnect();
        return res.json({ success: true, message: 'Admin existe déjà', email: 'admin@demo.com', note: 'Mot de passe déjà configuré.' });
      }
      const adminPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Administrateur Demo',
          email: 'admin@demo.com',
          password: adminPassword,
          role: 'ADMIN',
          phone: '+33123456789'
        }
      });
      await prisma.$disconnect();
      return res.json({
        success: true,
        message: 'Admin créé avec succès',
        email: 'admin@demo.com',
        note: 'Connectez-vous avec le mot de passe défini (changez-le immédiatement).'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  });
  app.post('/api/create-admin', async (req, res) => {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcrypt');
    const prisma = new PrismaClient();
    try {
      const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@demo.com' } });
      if (existingAdmin) {
        await prisma.$disconnect();
        return res.json({ success: true, message: 'Admin existe déjà', email: 'admin@demo.com', note: 'Mot de passe déjà configuré.' });
      }
      const adminPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Administrateur Demo',
          email: 'admin@demo.com',
          password: adminPassword,
          role: 'ADMIN',
          phone: '+33123456789'
        }
      });
      await prisma.$disconnect();
      return res.json({
        success: true,
        message: 'Admin créé avec succès',
        email: 'admin@demo.com',
        note: 'Changez le mot de passe immédiatement après connexion.'
      });
    } catch (error) {
      await prisma.$disconnect().catch(() => {});
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  });
}

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
// Brancher le service notifications (DB -> WebSocket)
const notificationService = require('./utils/notificationService');
notificationService.initNotificationService(io);

server.listen(PORT, HOST, () => {
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

