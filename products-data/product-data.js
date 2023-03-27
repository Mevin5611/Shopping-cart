var db = require('../config/connection')
var collection = require('../config/collections')
const { response } = require('../app')
var objectId = require('mongodb').ObjectId

module.exports = {


    addproduct: (products, callback) => {
    
        db.get().collection('products').insertOne(products).then((data) => {

            callback(data.insertedId)


        })

    },
    getallProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (proid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: new objectId(proid) }).then((response) => {
                console.log(response);
                resolve(response)

            })
        })
    }, getProductDetails: (proid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new objectId(proid) }).then((product) => {
                resolve(product)
            })
        })

    },
    updateProduct: (proid, proDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: new objectId(proid) }, {
                $set: {
                    name: proDetails.name,
                    category: proDetails.category,
                    description: proDetails.description,
                    prize: proDetails.prize
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    getPlacedOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({status:{$in:['placed','shipped','out for delivery']}}).toArray()
            console.log(orders);
            resolve(orders)
        })
    },
    getOrderstatus: (orderId) => {
        console.log("ordersid",orderId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: new objectId(orderId) }).then((order) => {
                resolve(order)
            })
        })

    },
    updateStatus: (orderId, orderStatus) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: new objectId(orderId) }, {
                $set: {
                    status: orderStatus.status
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    getDeliverdOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({status:'deliverd'}).toArray()
            console.log(orders);
            resolve(orders)
        })
    },
    getallOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            console.log(orders);
            resolve(orders)
        })
    }
    


}