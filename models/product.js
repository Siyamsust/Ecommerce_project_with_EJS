const fs = require('fs');
const path = require('path');
//const products=[];
const p = path.join(
    path.dirname(process.mainModule.filename),
    'data',
    'product.json'
);
const getProductsFromFile = cb => {
    fs.readFile(p, (err, fileContent) => {
        if (err) {
            cb([]);

        }
        else {
            cb(JSON.parse(fileContent));
        }
    });
};
module.exports = class product {
    constructor(t) {
        this.title = t;
    }
    save() {
        /* 
        fs.readFile(p, (err, fileContent) => {
            let products = [];
            if (!err) {
                products = JSON.parse(fileContent);
            }
            products.push(this);
            fs.writeFile(p, JSON.stringify(products), (err) => {
                console.log(err);

            });
        });
        */
        getProductsFromFile(products=>{
            products.push(this);
            fs.writeFile(p, JSON.stringify(products), (err) => {
                console.log(err);

         });
        });
        //products.push(this);

    }
    static fetchAll(cb)//cb is funtion defined in controller products for getting the products
    {

        getProductsFromFile(cb);

    }
}