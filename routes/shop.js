const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');
const { get } = require('http');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart', isAuth, shopController.postCart);

router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

router.post('/create-order', isAuth, shopController.postOrder);
router.get('/checkout',isAuth,shopController.getCheckout);
//router.get('/checkout',isAuth,shopController.getBcheck);
router.get('/orders', isAuth, shopController.getOrders);
router.get('/orders/:invoiceId', isAuth,shopController.getInvoice);
module.exports = router;
