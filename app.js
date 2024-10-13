const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.set( 'view engine','pug');//told the express that want to  compile dynamic template with pug engine
app.set('views','views');//where to  find the template

const adminData = require('./routes/admin');
//console.log(adminData);
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', adminData.routes);
app.use(shopRoutes);


app.use((req, res, next) => {
    res.status(404).render('404',{Pagetitle:'404'});
});

app.listen(3000);
