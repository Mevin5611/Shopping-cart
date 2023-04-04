var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: 'rzp_test_xM0ObMLfJ8FRhi',
    key_secret: '5Z5FGhXspPGEWvnID9gmN1pa',
});

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.insertedId)
            })

        })



    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {

                    if (status) {
                        console.log("login success");
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("login failed");
                        resolve({ status: false })
                    }
                })
            } else {
                console.log("login failed");
                resolve({ status: false })
            }
        })
    },
    addToCart: (proid, userid) => {

        let proObj = {
            item: new objectId(proid),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectId(userid) })
            if (userCart) {
                let proExist = userCart.product.findIndex(product => product.item == proid)
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: new objectId(userid), 'product.item': new objectId(proid) }, {
                        $inc: { 'product.$.quantity': 1 }
                    }).then(() => {
                        resolve()

                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: new objectId(userid) }, {
                        $push: { product: proObj }
                    }).then((response) => {
                        resolve()
                    })
                }




            } else {
                let cartObj = {
                    user: new objectId(userid),
                    product: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProduct: (userid) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db
                .get()
                .collection(collection.CART_COLLECTION)
                .aggregate([
                    {
                        $match: { user: new objectId(userid) },
                    },
                    {
                        $unwind: '$product'
                    },
                    {
                        $project: {
                            item: '$product.item',
                            quantity: '$product.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'products'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                        }
                    }



                ])
                .toArray();

            resolve(cartItems);

        });
    },
    getCartCount: (userid) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectId(userid) })
            if (cart) {
                count = cart.product.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        console.log(details);
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: new objectId(details.cart) },
                    {
                        $pull: { product: { item: new objectId(details.products) } }
                    }).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: new objectId(details.cart), 'product.item': new objectId(details.products) }, {
                        $inc: { 'product.$.quantity': details.count }
                    }).then((response) => {

                        resolve({ status: true })

                    })
            }

        })

    },
    removeProducts: (details) => {
        console.log(details)
        return new Promise((resolve, reject) => {
            
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: new objectId(details.cart) },
                    {
                        $pull: { product: { item: new objectId(details.products) } }
                    }).then((response) => {
                        resolve({ removeProduct: true })
                    })
        

                
            

        })

    },
    getTotalAmount: (userid) => {

        return new Promise(async (resolve, reject) => {
            let total = await db
                .get()
                .collection(collection.CART_COLLECTION)
                .aggregate([
                    {
                        $match: { user: new objectId(userid) },
                    },
                    {
                        $unwind: '$product'
                    },
                    {
                        $project: {
                            item: '$product.item',
                            quantity: '$product.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'products'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ['$quantity', { $convert: { input: '$products.prize', to: 'int' } }] } }
                        }
                    }

                ])
                .toArray();
                if(total[0]){
                    resolve(total[0].total);
                }else{
                    resolve([])
                }
            

        });
    },
    placeOrder: (order, product, total) => {

        return new Promise((resolve, reject) => {
            console.log(order, product, total);
            const date= new Date()
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                userid: new objectId(order.userid),
                paymentMethod: order['payment-method'],
                product: product,
                totalAmount: total,
                status: status,
                date: date.toDateString()
                
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: new objectId(order.userid) })
                resolve(response.insertedId)
            })

        })

    },
    getProductList: (userid) => {
        return new Promise(async (resolve, reject) => {
            
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectId(userid) })
            resolve(cart.product)
        })
    },
    getUserOrders: (userid) => {
        return new Promise(async (resolve, reject) => {
            console.log(userid);
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userid: new objectId(userid) }).toArray()
            console.log(orders);
            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderdItems = await db
                .get()
                .collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: { _id: new objectId(orderId) },
                    },
                    {
                        $unwind: '$product'
                    },
                    {
                        $project: {
                            item: '$product.item',
                            quantity: '$product.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'products'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                        }
                    }



                ])
                .toArray();
            console.log(orderdItems);
            resolve(orderdItems);

        });

    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                console.log("new order :", order);
                resolve(order)
            });
        })
    },
    verifyPayment:(details)=>{
        return new Promise(async(resolve,reject)=>{
            const crypto = require("crypto"); 
              let hmac = crypto.createHmac('sha256', '5Z5FGhXspPGEWvnID9gmN1pa');
              hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
              hmac=hmac.digest('hex');
             if(hmac===details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
            
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:new objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
            ).then(()=>{
                resolve()
            })
        })
    }



}