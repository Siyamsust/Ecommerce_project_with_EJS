const Product = require('../models/product');
const Order = require('../models/order');
const User=require('../models/user');
const fs=require('fs');
const bcrypt=require('bcryptjs');
const path=require('path');
const PDFDocument =require('pdfkit');
const stripe = require('stripe')('sk_test_51QYwWhBChbQGBbLewdCMlxNXl4kvSpsWdTjF4roHmTfqng0HbSrHmFxxPJqCTKrNGxTijEeXyUsH06qkPNISPWPH00s0s6aKph');
//const fileHelper=require('../util/file');
exports.getProducts = (req, res, next) => {
  Product.find()//used for mongoose for fetching all products but can use fetch all for mongodb which I need to  implement .cursor() for fetching a item at a time
    .then(products => {
      const addedtoCart = req.session.addedtoCart || null;
      req.session.addedtoCart = null; 
      console.log(products);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        addedtoCart: addedtoCart,
        //isAuthenticated: req.session.isLoggedIn,
       // csrfToken:req.csrfToken()
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  let addedtoCart = req.session.addedtoCart;
  
  // Clear the session value immediately
  req.session.addedtoCart = null;
  
  Product.findById(prodId)
    .then(product => {
      return req.session.save(err => {
        if (err) {
          console.log('Session save error:', err);
        }
        res.render('shop/product-detail', {
          product: product,
          pageTitle: product.title,
          path: '/products',
          addedtoCart: addedtoCart
        });
      });
    })
    .catch(err => {
      console.log(err);
      res.redirect('/500');
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      const addedtoCart = req.session.addedtoCart || null;
      req.session.addedtoCart = null; 
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        addedtoCart: addedtoCart,
      });
    })
    .catch(err => {
      console.log(err);
    });
};


exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        addedtoCart:'Added to Cart',
        //isAuthenticated: req.session.isLoggedIn,
        // csrfToken:req.csrfToken()
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    const quantity = parseInt(req.body.quantity) || 1;
    
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product, quantity);
        })
        .then(result => {
          
          req.session.addedtoCart = prodId;
          return req.session.save(err => {
            if (err) {
              console.log('Session save error:', err);
            }
            console.log('Added to cart:', prodId);
            const referer = req.get('Referer');
            res.redirect(referer || '/cart');
          });
     
    })
    .catch(err => {
      console.log('Add to cart error:', err);
      res.redirect('/500');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};
exports.getCheckout = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items;
      console.log("all prod");
      console.log(products);
      let total=0;
      products.forEach(p=>{
        total+=p.quantity*p.productId.price;
      });
      //const userId=req.session.user._id
       const bankDetails =user.bankDetails;
       console.log(bankDetails);
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum:total,
        bankDetails:bankDetails,
        // accountName:User.name,
        // acountNumber:User.bankDetails.accountNumber,
        // cbc:User.bankDetails.cbc

        //addedtoCart:'Added to Cart',
        //isAuthenticated: req.session.isLoggedIn,
        // csrfToken:req.csrfToken()
      })
      // User.findById(userId).select('bankDetails').then(res.render('shop/checkout', {
      //   path: '/checkout',
      //   pageTitle: 'Checkout',
      //   products: products,
      //   totalSum:total,
      //   accountName:User.name,
      //   acountNumber:User.bankDetails.accountNumber,
      //   cbc:User.bankDetails.cbc

        //addedtoCart:'Added to Cart',
        //isAuthenticated: req.session.isLoggedIn,
        // csrfToken:req.csrfToken()
      })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      console.log(user);
      const secretkey = req.body.secretKey;
      console.log(secretkey);
      
      bcrypt.compare(secretkey, user.bankDetails.secretKey)
        .then(doMatch => {
          if (doMatch) {
            const products = user.cart.items.map(i => {
              return { quantity: i.quantity, product: { ...i.productId._doc } };
            });

            const order = new Order({
              user: {
                email: req.user.email,
                userId: req.user,
              },
              products: products,
            });

            console.log(products);

            // Create a map to track owners' money updates
            const ownerUpdates = [];
            let money=0;
            // Loop through each product in the cart
            products.forEach(prod => {
              const productOwnerId = prod.product.userId;

              let moneyToAdd = prod.quantity * prod.product.price;
                   money+=moneyToAdd;
              // Find the product owner and update their money
              ownerUpdates.push(
                User.findById(productOwnerId)
                  .then(owner => {
                    if (owner) {
                      if (owner.money === undefined) {
                        owner.money = 0; // Initialize money if it's undefined
                      }

                      owner.money += moneyToAdd; // Add the calculated money to the owner's balance
                      console.log(`Updated owner ${owner.email}'s money: ${owner.money}`);
                      return owner.save(); // Save the updated owner
                    } else {
                      throw new Error("Product owner not found");
                    }
                  })
              );
            });

            // After all the product owners are updated, save the order and user cart clearing
            Promise.all(ownerUpdates)
              .then(() => {
                return order.save();  // Save the order after updating the product owners
              })
              .then(() => {
                return req.user.clearCart(); // Clear the user's cart
              })
              .then(() => {
                res.redirect('/orders');
              })
              .catch(err => {
                console.error(err);
                res.redirect('/500'); // Or handle the error appropriately
              });
          }
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
       //  isAuthenticated: req.session.isLoggedIn,
        // csrfToken:req.csrfToken()
      });
    })
    .catch(err => console.log(err));
};

exports.getInvoice=(req,res,next)=>{


  const orderId=req.params.invoiceId;
  console.log(orderId);
  Order.findById(orderId).then(order=>{
    if(!order){
      console.log('Order not found');
    }
    else if(order.user.userId.toString()==req.user._id.toString()){
      const invoiceName='invoice-'+orderId+'.pdf';
      const invoicePath=path.join('data','invoices',invoiceName);
      const pdfDoc=new PDFDocument();
      res.setHeader('Content-Type','application/pdf');
      res.setHeader('Content-Disposition','inline; filename="'+ invoiceName+'"')
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(26).text('Invoice',{underline:true });
      pdfDoc.text('-------------------------')
      let totalPrice=0;
      order.products.forEach(prod=>{
        totalPrice+=prod.quantity*prod.product.price;
        pdfDoc.fontSize(14).text(prod.product.title+'-'+prod.quantity+'x'+new Intl.NumberFormat('en-US').format(prod.product.price));
      });
      pdfDoc.text('-------------------------');
      pdfDoc.fontSize(14).text('Total Price: $'+new Intl.NumberFormat('en-US').format(totalPrice));
      pdfDoc.end();
      // fs.readFile(invoicePath,(err,data)=>{//data will be in the buffer form
      //  if(err){
      //    console.log(err);
      //  }
      //  res.setHeader('Content-Type','application/pdf');
      // res.send(data);
      
      // })
    //  const file=fs.createReadStream(invoicePath);
      
      //file.pipe(res);
    }
    else {
      console.log("unauthorize")
    }

  })
 
};