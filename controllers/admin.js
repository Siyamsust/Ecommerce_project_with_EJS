const mongoose = require('mongoose');
const fileHelper = require('../util/file');
const User=require('../models/user');
const { validationResult } = require('express-validator');
const bcrypt=require('bcryptjs');
const Product = require('../models/product');
const { file } = require('pdfkit');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    addedtoCart:null,
    validationErrors: [],
    totalCartItems: totalCartItems,
  });
};
exports.getProfile=(req,res,next)=>{
  const useId=req.user._id;
  console.log('something');
  console.log('hi'+useId);  
  User.findById(useId)
  .then(res.render('admin/profile', {
    pageTitle: 'User Profile',
    path: '/profile',
    user: req.user,
    editing: false,
    csrfToken: req.csrfToken(),
    hasError: false,
    errorMessage: null,
    totalCartItems:totalCartItems,
    //addedtoCart:null,
    //validationErrors: []
  })).catch(err=>{
    console.log(err);
  });
}
exports.postBank=(req,res,next)=>{
  const { address, accountNumber, cbc, secretKey } = req.body;
  const image = req.file;
  console.log('in Bank');
  // You can add validation logic for the bank data here (optional)
  bcrypt.hash(secretKey,12).then(hashKey=>{
    User.findById(req.user._id)

    .then(user => {
      if(!image){
        console.log(image);
        //const imageUrl = image.path.replace(/\\\\/g, '\\');
       // user.imageUrl=imageUrl;
        user.bankDetails = {
          address:address,
          accountNumber:accountNumber,
          cbc:cbc,
          secretKey:hashKey
        };
         console.log(hashKey);
        
        return user.save();
      }
       console.log(image);
      const imageUrl = image.path.replace(/\\\\/g, '\\');
      user.imageUrl=imageUrl;
      user.bankDetails = {
        address:address,
        accountNumber:accountNumber,
        cbc:cbc,
        secretKey:hashKey
      };
       console.log(hashKey);
      
      return user.save();
    })
  })
  
    .then(result => {
      res.redirect('/');
    })
    .catch(err => console.log(err));
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image.',
      addedtoCart:null,
      validationErrors: []
    });
  }
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array()[0].msg);
   // console.log(res.status());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      addedtoCart:null,
    
      validationErrors: errors.array()
    });
  }

  const imageUrl = image.path.replace(/\\\\/g, '\\');

  const product = new Product({
    // _id: new mongoose.Types.ObjectId('5badf72403fd8b5be0366e81'),
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      // return res.status(500).render('admin/edit-product', {
      //   pageTitle: 'Add Product',
      //   path: '/admin/add-product',
      //   editing: false,
      //   hasError: true,
      //   product: {
      //     title: title,
      //     imageUrl: imageUrl,
      //     price: price,
      //     description: description
      //   },
      //   errorMessage: 'Database operation failed, please try again.',
      //   validationErrors: []
      // });
      // res.redirect('/500');
      console.log(err);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        addedtoCart:null,
        validationErrors: []
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  console.log(image);
  const updatedDesc = req.body.description;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array()[0].msg);
   // console.log(res.status());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      addedtoCart:null,
    
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path.replace(/\\/g, '/');
      }
      return product.save().then(result => {
        console.log('UPDATED PRODUCT!');
        res.redirect('/admin/products');
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProducts = (req, res, next) => {
  const user=req.user;
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      //console.log(products);
      const addedtoCart=req.session.addedtoCart||null;
      req.session.addedtoCart=null;
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        user:user,
        addedtoCart:addedtoCart,
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId).then(product=>{
    if(product)
    {fileHelper.deleteFile(product.imageUrl);
    return  Product.deleteOne({ _id: prodId, userId: req.user._id })
    }
  })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/products');
    })
    .catch(err => {
      console.log(err);
    });
};
