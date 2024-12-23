const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStore =require('connect-mongodb-session')(session);
const MONGODB_URI = 'mongodb+srv://siyam_83:LOCket43@cluster0.8nzfq.mongodb.net/shop?';
const errorController = require('./controllers/error');
//const mongoConnect = require('./util/database').mongoConnect;
const mongoose=require('mongoose');
const User=require('./models/user');
const app = express();
const store=new MongoDBStore({
uri :MONGODB_URI,
collection:'sessions'

});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
     secret: 'my secret',
      resave: false,
       saveUninitialized: false,
       store:store })
 );
app.use((req, res, next) => {
  User.findById('676829af930dbc9145804a1c')
    .then(user => {
      req.user = user; //mongoose model instance //new User(user.name,user.email, user.cart,user._id);
       console.log('User:',req.user);
      next();
    })
    .catch(err => console.log(err));
});


app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

// mongoConnect(() => {
//   app.listen(3000);
// });
mongoose.
connect(
  MONGODB_URI
   )
 .then(result => {
  User.findOne().then(user => {
    if (!user) {
       user = new User({
        name: 'Siyam',
        email: 'ahamedsiyam43@gmail.com',
        phone:'01742636434',
        cart: {
          items: []
        }
      });
      user.save().then(result=>{console.log('User Created')}).catch(err=>{console.log(err)});
      
    }
  });
  app.listen(3000);
})
 .catch(err=>{
  console.log(err);
});
