const path = require('path');

const express = require('express');

const rootDir = require('../util/path');

const router = express.Router();
const adminData=require('./admin');
router.get('/', (req, res, next) => {
 // console.log('shop js',adminData.product);
 const product=adminData.product 
 res.render('shop',{prods:product,Pagetitle:'Shop',path:'/'})//this will use the default engine in this case we set it to  pug
  //res.sendFile(path.join(rootDir, 'views', 'shop.html'));this for using html
});

module.exports = router;
