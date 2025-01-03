const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const errorController = require('./controllers/error');
const nodemailer = require('nodemailer');
const multer = require('multer');

const User = require('./models/user');
const flash = require('connect-flash');
//const mongoConnect = require('./util/database').mongoConnect;
 


const MONGODB_URI =
  'mongodb+srv://siyam_83:LOCket43@cluster0.8nzfq.mongodb.net/shop?';

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});
const csrfProtection = csrf();
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g,'-') + '-' + file.originalname);
  }
});
const fileFilter=(req,file,cb)=>{
 if(file.mimetype==='image/png'||
  file.mimetype==='image/jpg'||
  file.mimetype==='image/jpeg'  ){
   cb(null,true);
 }
 else{
    cb(null,false);
 }

};
app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
//app.use(multer({dest:'images'}).single('image'));
app.use(multer({ storage: fileStorage ,fileFilter: fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);
app.use(flash());
app.use((req,res,next)=>{
  if(!req.session.user){
    return next();
  }
  console.log(req.session.user._id);
  User.findById(req.session.user._id)
  
  .then(user=>{
    req.user=user;
    next();
  })
  .catch(err=>console.log(err));
})
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();


});



app.use(authRoutes);


app.use('/admin', adminRoutes);

app.use(shopRoutes);
//app.get('/500', errorController.get500);
app.use(errorController.get404);


// mongoConnect(() => {
//   app.listen(3000);
// });
mongoose
  .connect(MONGODB_URI)
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
