const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const clientRoutes = require('./routes/clientRoutes');
const authRoutes = require('./routes/authRoutes');
const notificationsRoutes = require('./routes/notifications');
const shopsRoutes = require('./routes/shops');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const paymentsRoutes = require('./routes/payments');
const invoicesRoutes = require('./routes/invoices');
const suppliersRoutes = require('./routes/suppliers');
const returnsRoutes = require('./routes/returns');
const reportsRoutes = require('./routes/reports');
const categoriesRoutes = require('./routes/categories');
const deliveriesRoutes = require('./routes/deliveries');
const quotesRoutes = require('./routes/quotes');
const recurringOrdersRoutes = require('./routes/recurring-orders');
const promotionsRoutes = require('./routes/promotions');
const messagesRoutes = require('./routes/messages');
const searchRoutes = require('./routes/search');
const exportsRoutes = require('./routes/exports');
const emailsRoutes = require('./routes/emails');
const securityRoutes = require('./routes/security');
const auditLogsRoutes = require('./routes/audit-logs');
const managerRoutes = require('./routes/manager');
const stockRoutes = require('./routes/stock');
const pricesRoutes = require('./routes/prices');
const avatarRoutes = require('./routes/avatar');
const orderContextRoutes = require('./routes/order-context');
const clientShopsRoutes = require('./routes/client-shops');
const clientFinanceRoutes = require('./routes/client-finance');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de logging (production: utiliser un logger approprié)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    // console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Configuration CORS - autorise le frontend en production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://fatah-commander.cloud',
  'http://fatah-commander.cloud',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));
app.use(express.json());
app.use(cookieParser());

// Routes principales
app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/recurring-orders', recurringOrdersRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/exports', exportsRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/order-context', orderContextRoutes);
app.use('/api/client-shops', clientShopsRoutes);
app.use('/api/client-finance', clientFinanceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || 'Une erreur est survenue',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

app.listen(PORT, () => {
  // console.log(`Server running on port ${PORT}`);
});
