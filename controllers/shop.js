const Product = require('../models/product');
const Order = require('../models/order');
const User=require('../models/user');
const fs=require('fs');
const bcrypt=require('bcryptjs');
const path=require('path');
const PDFDocument =require('pdfkit');
const stripe = require('stripe')('sk_test_51QYwWhBChbQGBbLewdCMlxNXl4kvSpsWdTjF4roHmTfqng0HbSrHmFxxPJqCTKrNGxTijEeXyUsH06qkPNISPWPH00s0s6aKph');
//const PendingOrder=require('../models/pending-order');
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
      const totalCartItems = req.user ? req.user.cart.items : [];
      
      return req.session.save(err => {
        if (err) {
          console.log('Session save error:', err);
        }
        res.render('shop/product-detail', {
          product: product,
          pageTitle: product.title,
          path: '/products',
          addedtoCart: addedtoCart,
          totalCartItems: totalCartItems
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
      const totalCartItems = req.user ? req.user.cart.items : [];
      
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        addedtoCart: addedtoCart,
        totalCartItems: totalCartItems
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
      const totalCartItems = req.user ? req.user.cart.items : [];
      
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        addedtoCart: 'Added to Cart',
        totalCartItems: totalCartItems
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
        errorMessage:''
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
              status: 'pending'
            });

            console.log(products);

            // Create a map to track owners' money updates
            const ownerUpdates = [];
            let money=0;
            const ownerProductMap = {};

            // Group products by owner
            products.forEach(prod => {
              const productOwnerId = prod.product.userId.toString();
              if (!ownerProductMap[productOwnerId]) {
                ownerProductMap[productOwnerId] = [];
              }
              ownerProductMap[productOwnerId].push(prod);
            });

            // Loop through each owner and update their pending orders
            Object.keys(ownerProductMap).forEach(ownerId => {
              const ownerProducts = ownerProductMap[ownerId];
              const moneyToAdd = ownerProducts.reduce((sum, prod) => sum + prod.quantity * prod.product.price, 0);

              ownerUpdates.push(
                User.findById(ownerId)
                  .then(owner => {
                    if (owner) {
                      if (owner.pendingmoney === undefined) {
                        owner.pendingmoney = 0; // Initialize money if it's undefined
                      }
                      
                      // Create pending order object with product details
                      const pendingOrder = {
                        orderId: order._id,
                        products: ownerProducts.map(prod => ({
                          title: prod.product.title,
                          productId: prod.product._id,
                          quantity: prod.quantity,
                          price: prod.product.price
                        })),
                        status: 'pending'
                      };
                      
                      // Add money and pending order
                      owner.pendingmoney += moneyToAdd;
                      owner.pendingOrders.push(pendingOrder);
                      
                      console.log(`Updated owner ${owner.email}'s money: ${owner.money}`);
                      return owner.save();
                    } else {
                      throw new Error("Product owner not found");
                    }
                  })
              );
            });

            // After all the product owners are updated, save the order and user cart clearing
            Promise.all(ownerUpdates)
              .then(() => {
                //console.log(order._id.toString());
                return order.save();  // Save the order after updating the product owners
              })
              .then(() => {
                console.log('the order is'+order);
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
          else{
            const products = user.cart.items;
            let total = 0;
            products.forEach(p => {
              total += p.quantity * p.productId.price;
            });

            res.render('shop/checkout', {
              path: '/checkout',
              pageTitle: 'Checkout',
              products: products,
              totalSum: total,
              bankDetails: user.bankDetails,
              errorMessage: 'Invalid secret key. Please try again.',
              // isAuthenticated: req.session.isLoggedIn,
              // csrfToken: req.csrfToken()
            });
          }
        })
        .catch(err => {
          
          console.log(err);
    });
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
exports.getPendingOrders = (req, res, next) => {
  const userId=req.user._id;
  User.findById(userId).then(user=>{

    
    res.render('shop/pending-orders', {
      path: '/pending-orders',
      pageTitle: 'Pending Orders',
      //orders: filteredOrders,

      pendingOrders:user.pendingOrders,

  });
    })
    .catch(err => console.log(err));
};
exports.markDelivered = (req, res, next) => {
    const orderId = req.body.orderId;

    // Find the order in the Order collection
    Order.findOne({ _id: orderId, 'products.product.userId': req.user._id })
        .then(order => {
            if (!order) {
                throw new Error('Order not found or unauthorized');
            }

            // Update the status of the products to 'delivered' in the Order collection
            order.products.forEach(product => {
                if (product.product.userId.toString() === req.user._id.toString()) {
                    product.status = 'delivered';
                }
            });

            return order.save();
        })
        .then(() => {
            // Find the order in the User's pending orders
            return User.findById(req.user._id);
        })
        .then(user => {
            const orderIndex = user.pendingOrders.findIndex(order => order.orderId.toString() === orderId.toString());

            if (orderIndex >= 0) {
                const deliveredOrder = user.pendingOrders[orderIndex];
                deliveredOrder.status = 'delivered';
                console.log(deliveredOrder);
                // Update owner's money
                deliveredOrder.products.forEach(prod => {
                    const productPrice = prod.quantity * prod.price;
                    console.log(prod.price);
                    if (!isNaN(productPrice)) {
                        if (user.money === undefined) {
                            user.money = 0;
                        }
                        //console.log(user);
                        user.money += productPrice;
                        user.pendingmoney -= productPrice;
                    } else {
                        console.error('Invalid product price:', prod.price);
                    }
                });

                user.deliveredOrders.push(deliveredOrder);
                user.pendingOrders.splice(orderIndex, 1);

                return user.save();
            } else {
                throw new Error('Order not found in user pending orders');
            }
        })
        .then(() => {
            res.redirect('/delivered');
        })
        .catch(err => {
            console.log(err);
            res.redirect('/500');
        });
};
exports.getDeliveredOrders = (req, res, next) => {
  const userId=req.user._id;
  User.findById(userId).then(user=>{
    res.render('shop/delivered-order', {
      path: '/delivered',
      pageTitle: 'Delivered Orders',
      deliveredOrders:user.deliveredOrders,
    });
  })
  .catch(err => console.log(err));
};
