const { json } = require('body-parser');
const fs = require('fs');
const path = require('path');
//let alert=require('alert');
const p = path.join(path.dirname(process.mainModule.filename), 'data', 'cart.json');
module.exports = class cart {

   static addproduct(id, totalprice) {
      //fetch the prev cart
      fs.readFile(p, (err, fileContent) => {
         let cart = { products: [], totalprice: 0 };
         if (!err) {
            cart = JSON.parse(fileContent);


         }
         //analyze if it exist
         const existingproductindex = cart.products.findIndex(product => product.id === id);
         const existingproduct = cart.products[existingproductindex];
         let updatedProduct;
         if (existingproduct) {
            updatedProduct = { ...existingproduct }
            updatedProduct.quantiny = updatedProduct.quantiny + 1;
            cart.products = [...cart.products];
            cart.products[existingproductindex] = updatedProduct;
            //alert("cart updated");
         }
         // Add new product/incr. quantity
         else {
            updatedProduct = { id: id, quantiny: 1 };
            cart.products = [...cart.products, updatedProduct]
            //alert("product added to the cart");
         }
         cart.totalprice = parseFloat(cart.totalprice) + parseFloat(totalprice);
         console.log(cart);
         fs.writeFile(p, JSON.stringify(cart), err => {
            console.log(err);
         })
      })


   }
   static getCart(cb) {
      fs.readFile(p, (err, fileContent) => {
         const cart = JSON.parse(fileContent);
         if (err)
            cb(null);
         else
            cb(cart)
      })
   }
   static deleteProduct(id, productPrice) {
      fs.readFile(p, (err, fileContent) => {
         let cart = { products: [], totalprice: 0 };
         if (!err) {
            //cart=JSON.parse(fileContent);
            const updatedCart =JSON.parse(fileContent);
            const product = updatedCart.products.find(prod => prod.id === id)
            const itquan = product.quantiny;
            updatedCart.products = updatedCart.products.filter(
               prod => prod.id !== id
            );
            updatedCart.totalprice = updatedCart.totalprice - itquan * productPrice;
            fs.writeFile(p,JSON.stringify(updatedCart),err=>{
               console.log(err);
            })
         }
         else return
      })
   }
}