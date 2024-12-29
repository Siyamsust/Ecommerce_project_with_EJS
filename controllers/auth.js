const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodeMailer = require('nodemailer');
const sibApiV3Sdk = require('sib-api-v3-sdk');
const crypto = require('crypto');
require('dotenv').config();
const client = sibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.API_KEY;
const transEmail = new sibApiV3Sdk.TransactionalEmailsApi();
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
    errorMessage: message
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
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log(password);
  User.findOne({ email: email })
    .then(user => {
      if(!user){
        req.flash('error','Invalid email or password');
        return res.redirect('/login');
      }
      //console.log(user.password);
      bcrypt.compare(password, user.password).
      then(doMatch=>{
        if(!doMatch){
          req.flash('error','Invalid email or password');
          return res.redirect('/login');
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
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone;
  console.log(password);
  const confirmPassword = req.body.confirmPassword;
  User.findOne({ 
      email: email
        
})
    .then(userDoc => {
      if (userDoc) {
         req.flash('serror','E-Mail or Phone already exists.Please pick a different one');         
        return res.redirect('/signup');
      }
      return bcrypt
        .hash(password, 12).then(hashedPassword => {
          const user = new User({
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
      
    }).then(err=>{
      console.log(err);
     
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
  });
  
}).catch(err=>{console.log(err);});
}
