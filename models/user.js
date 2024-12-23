
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: { type: Number, required: true }
      }
    ]
  }
});
userSchema.methods.addToCart = function(product) {

  const cartProduct=this.cart.items.findIndex(cp=>{ 
      return cp.productId.toString()===product._id.toString();
    }); 
    let newQuantity=1;
    const updatedCartItems=[...this.cart.items];
      if(cartProduct>=0){
      newQuantity=this.cart.items[cartProduct].quantity+1;
      updatedCartItems[cartProduct].quantity=newQuantity;
      }
      else{
        updatedCartItems.push({productId:product._id,quantity:newQuantity});
      }
      const updatedCart={items:updatedCartItems};
      //const db=getdb();
      this.cart=updatedCart;
      this.save();  
    


}
userSchema.methods.removeFromCart = function(productId) {
  const updatedCartItems = this.cart.items.filter(item => {
    return item.productId!=productId;
  });
  this.cart.items=updatedCartItems;
  return this.save();
};
userSchema.methods.clearCart = function() {
  this.cart={items:[]};
  return this.save();
}


module.exports = mongoose.model('User', userSchema);
















//****---Below is the code for the User model using Mongodb ---****
// const getdb=require('../util/database').getDb;
// const mongodb=require('mongodb');
// class User{
//   constructor(username,email,cart,_id){
//     this.name=username;
//     this.email=email;
//     this.cart=cart;
//     this._id=_id;
//   }
//   save(){
//     const db=getdb();
//     return db.collection('users').insertOne(this);

//   }
//   addToCart(product)
//   { const cartProduct=this.cart.items.findIndex(cp=>{ 
//     return cp.productId.toString()===product._id.toString();
//   }); 
//   let newQuantity=1;
//   const updatedCartItems=[...this.cart.items];
//     if(cartProduct>=0){
//     newQuantity=this.cart.items[cartProduct].quantity+1;
//     updatedCartItems[cartProduct].quantity=newQuantity;
//     }
//     else{
//       updatedCartItems.push({productId:new mongodb.ObjectId(product._id),quantity:newQuantity});
//     }
//     const updatedCart={items:updatedCartItems};
//     const db=getdb();
//     return db.
//     collection('users')
//     .updateOne({_id:new mongodb.ObjectId(this._id)},{$set:{cart :updatedCart}});   
//   }             
   
//   getCart(){
//     const db=getdb();
//     const productIds=this.cart.items.map(i=>{
//       return i.productId;
//     });
//     return db.collection('products').find({_id:{$in:productIds}}).toArray()
//     .then(products=>{
//       return products.map(p=>{
//         return {...p,quantity:this.cart.items.find(i=>{
//           return i.productId.toString()===p._id.toString();
//         }).quantity};
//       });
//     });

//   }
//   addOrder()
//   {
//  const db=getdb();
//  return this.getCart().then(products=>{
//   const order={items:products,
//     user:{
//       _id:new mongodb.ObjectId(this._id),
//       name:this.name,
//       email:this.email
 
//     }
//   } 
//    return db.collection('orders').insertOne(order)})
//   .then(result=>{
//   this.cart={items:[]};
//   return db.collection('users').updateOne({_id:new mongodb.ObjectId(this._id)},{$set:{cart:{items:[]}}});
//  })
//  .
//  catch
//  (err=>
//   {console.log(err); }
// );
//   };

//   getOrders(){
//     const db=getdb();
//     return db.collection('orders').find({'user._id':new mongodb.ObjectId(this._id)}).toArray();
//   }
//   deleteItemFromCart(productId){
//     const updatedCartItems=this.cart.items.filter(item=>{
//       return item.productId.toString()!==productId.toString();
//     });
//     const db=getdb();
//     return db.collection('users').updateOne({_id:new mongodb.ObjectId(this._id)},{$set:{cart:{items:updatedCartItems}}});
//   }
//   static findById(userId){
//    const db=getdb();
//    return db.collection('users').findOne({_id: new mongodb.ObjectId(userId)})
//    .then(user=>{  
//     console.log(user);
//     return user;
//    })
//    .catch(err=>{
//     console.log(err);
//    });
//   }


// }
// module.exports=User;