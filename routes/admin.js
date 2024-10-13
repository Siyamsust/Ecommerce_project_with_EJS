const path = require('path');

const express = require('express');

const productController=require('../controllers/products');
const router = express.Router();



// /admin/add-product => GET
router.get('/add-product', productController.getAddproduct);

// /admin/add-product => POST
router.post('/add-product', productController.postAddproduct);

module.exports = router;
//exports.products = products;
