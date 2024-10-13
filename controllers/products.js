  const Product=require('../models/product')
  exports.getAddproduct=(req, res, next) => {
    res.render('admin/add-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      formsCSS: true,
      productCSS: true,
      activeAddProduct: true
    });
  }
  exports.postAddproduct=(req, res, next) => {
    //products.push({ title: req.body.title });
    const prod=new Product(req.body.title);
    prod.save();
    res.redirect('/');
  }
  exports.getProducts=(req, res, next) => {
   Product.fetchAll((products)=>{  //this will now fetch the products from the data folder
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'Shop',
            path: '/',
            hasProducts: products.length > 0,
            activeShop: true,
            productCSS: true
          });
    });//because I declare it statitc in the file so do not need a new product
    
  };