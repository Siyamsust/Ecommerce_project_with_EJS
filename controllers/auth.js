const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodeMailer = require('nodemailer');
const sibApiV3Sdk = require('sib-api-v3-sdk');
const crypto = require('crypto');
const { reset } = require('mongodb/lib/core/connection/logger');
require('dotenv').config();
const client = sibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.API_KEY;
const transEmail = new sibApiV3Sdk.TransactionalEmailsApi();
const {validationResult}=require('express-validator');
const sender ={
  name:'Siyam',
  email:'ahamedsiyam43@gmail.com'
}

exports.getLogin = (req, res, next) => {
  let message=req.flash('error');
  if(message.length>0){
    message=message[0];
  }
  else{
    message=null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false,
    errorMessage: message,
    oldInput:{
      email:'',
      password:''

    },
    validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message=req.flash('serror');
  if(message.length>0){
    message=message[0];
  }
  else{
    message=null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: message,
    oldInput:{
      email:'',
      password:'',
      phone:'',
      confirmPassword:''
    },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors=validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: errors.array()
    });
  }
  console.log(password);
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }
      //console.log(user.password);
      bcrypt.compare(password, user.password).
      then(doMatch=>{
        if(!doMatch){
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: []
          });
        }
        req.session.isLoggedIn = true;
        req.session.user = user;
       return req.session.save(err => {
          console.log(err);

          res.redirect('/');
        });


      }).
      catch(err=>{
        console.log(err);
        res.redirect('/login');
    });
      
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone;
  const name =req.body.name;
  console.log(password);
  //const confirmPassword = req.body.confirmPassword;
  const errors=validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: errors.array()[0].msg,
    oldInput: {
      name:name,
      email: email,
      password: password,
      phone: phone,
      confirmPassword: req.body.confirmPassword
    },
    validationErrors: errors.array()
  });
  }
//   User.findOne({ 
//       email: email
        
// })
    // .then(userDoc => {
    //   if (userDoc) {
    //      req.flash('serror','E-Mail or Phone already exists.Please pick a different one');         
    //     return res.redirect('/signup');
    //   }
    //   return 
      bcrypt
        .hash(password, 12).then(hashedPassword => {
          const user = new User({
          name: name,  
          email: email,
          password: hashedPassword,
          phone: phone,
          cart: { items: [] }
          
        });
        return user.save();
      })
    .then(result => {
      res.redirect('/login');
      const receiver = [
        {email: email
      }];
      return transEmail.sendTransacEmail({
        sender, // Sender email
        to: receiver, // Corrected 'to' format
        subject: 'Signup succeeded!',
        textContent: 'You successfully signed up!', // Correct case-sensitive key
        htmlContent: '<p><strong>You have successfully signed up! Welcome to our platform. Enjoy Shopping</strong></p>'
      });
      
    })
    .catch(err => {
      console.log(err);
    });
  }

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};
exports.getReset =(req,res,next)=>{
  let message=req.flash('error');
  if(message.length>0){
    message=message[0];
  }
  else{
    message=null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    //isAuthenticated: false,
    errorMessage: message
  });
};
exports.postReset =(req,res,next)=>{
  crypto.randomBytes(32,(err,buffer)=>{
    if(err){
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    console.log(token);
    User.findOne({email:req.body.email}).then(user=>{
      if(!user){
        req.flash('error','No account with that email found');
        return res.redirect('/reset');
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      return user.save();
    }).then(result=>{
      res.redirect('/');
      const receiver = [
        {email: req.body.email
      }];
      return transEmail.sendTransacEmail({
        sender, // Sender email
        to: receiver, // Corrected 'to' format
        subject: 'Password Reset',
        textContent: 'You requested a password reset', // Correct case-sensitive key
        htmlContent: `<p><strong>You requested a password reset</strong></p>
        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>`
      });
    }).catch(err=>{
      console.log(err);
    });
  })
};
exports.getNewPassword =(req,res,next)=>{
  const token = req.params.token;
  User.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now()}}).then(user=>{
  let message=req.flash('error');
  if(message.length>0){
    message=message[0];
  }
  else{
    message=null;
  }
  res.render('auth/new-password', {
    path: '/new-password',
    pageTitle: 'Reset Password',
    //isAuthenticated: false,
    errorMessage: message,
    userId:user._id.toString(),
    passwordToken:token
  });
  
}).catch(err=>{console.log(err);});
};
exports.postNewPassword =(req,res,next)=>{
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User.findOne({
    resetToken:passwordToken,
    resetTokenExpiration:{$gt:Date.now()},
    _id:userId
  })
  .then(user=>{
    resetUser = user;
    return bcrypt.hash(newPassword,12);

  }).then(hashedPassword=>{
   resetUser.password = hashedPassword;
   resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save();

  }).then(result=>{
    res.redirect('/login');
  }).catch(err=>{
    console.log(err);
  })
}
