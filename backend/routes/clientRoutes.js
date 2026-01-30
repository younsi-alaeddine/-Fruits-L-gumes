const express = require('express');
const { authenticate, requireClient } = require('../middleware/auth');
const { scopeByShop, validateShopAccess } = require('../middleware/shopScoping');
const storesController = require('../controllers/storesController');
const ordersController = require('../controllers/ordersController');
const productsController = require('../controllers/productsController');
const stocksController = require('../controllers/stocksController');
const invoicesController = require('../controllers/invoicesController');
const usersController = require('../controllers/usersController');
const profileController = require('../controllers/profileController');
const financesController = require('../controllers/financesController');

const router = express.Router();

router.use(authenticate);
router.use(requireClient);
router.use(scopeByShop);

router.get('/stores', storesController.getAll);
router.get('/stores/:id', storesController.getById);
router.post('/stores', storesController.create);
router.put('/stores/:id', storesController.update);
router.delete('/stores/:id', storesController.deleteItem);

router.get('/orders', ordersController.getAll);
router.get('/orders/:id', ordersController.getById);
router.post('/orders', ordersController.create);
router.put('/orders/:id', ordersController.update);
router.post('/orders/:id/cancel', ordersController.cancel);
router.get('/orders/:id/confirmation', ordersController.downloadConfirmation);

router.get('/products', productsController.getAll);
router.get('/products/:id', productsController.getById);
router.get('/stores/:storeId/products', validateShopAccess, productsController.getByStore);

router.get('/stocks', stocksController.getAll);
router.get('/stores/:storeId/stocks', validateShopAccess, stocksController.getByStore);

router.get('/invoices', invoicesController.getAll);
router.get('/invoices/:id', invoicesController.getById);
router.get('/invoices/:id/download', invoicesController.download);

router.get('/users', usersController.getAll);
router.get('/users/:id', usersController.getById);
router.post('/users', usersController.create);
router.put('/users/:id', usersController.update);
router.delete('/users/:id', usersController.deleteItem);

router.get('/profile', profileController.get);
router.put('/profile', profileController.update);
router.post('/profile/avatar', profileController.uploadAvatar);

router.get('/finances/summary', financesController.getSummary);
router.get('/finances/transactions', financesController.getTransactions);

module.exports = router;
