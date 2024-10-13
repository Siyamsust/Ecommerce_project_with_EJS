const path = require('path');

const express = require('express');

const rootDir = require('../util/path');

const router = express.Router();
const product=[];

// /admin/add-product => GET
router.get('/add-product', (req, res, next) => {
  
  res.render('add-product',{Pagetitle:'Add-product',path:'/admin/add-product'});
});

// /admin/add-product => POST
router.post('/add-product', (req, res, next) => {
  //console.log(req.body);
  product.push({title:req.body.title});
  res.redirect('/');
});

exports.routes = router;
exports.product=product;