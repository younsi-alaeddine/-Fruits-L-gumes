const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Distribution Fruits & Légumes',
      version: '1.0.0',
      description: 'API REST pour la gestion d\'une entreprise de distribution de fruits et légumes en France',
      contact: {
        name: 'Support API',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Serveur de développement',
      },
      {
        url: 'https://api.example.com',
        description: 'Serveur de production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'CLIENT'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            photoUrl: { type: 'string' },
            priceHT: { type: 'number' },
            tvaRate: { type: 'number' },
            unit: { type: 'string', enum: ['kg', 'caisse', 'piece', 'botte'] },
            category: { type: 'string', enum: ['FRUITS', 'LEGUMES', 'HERBES', 'FRUITS_SECS'] },
            isActive: { type: 'boolean' },
            stock: { type: 'number' },
            stockAlert: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            shopId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['NEW', 'PREPARATION', 'LIVRAISON', 'LIVREE', 'ANNULEE'] },
            paymentStatus: { type: 'string', enum: ['EN_ATTENTE', 'PAYE', 'IMPAYE', 'REMBOURSE'] },
            totalHT: { type: 'number' },
            totalTVA: { type: 'number' },
            totalTTC: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './server.js'], // Chemins vers les fichiers contenant les annotations Swagger
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

