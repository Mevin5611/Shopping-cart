const { response } = require('express');
var express = require('express');
var router = express.Router();
var productdata = require('../products-data/product-data')
const Helper = require('../helpers/user-data');
const session = require('express-session');
const verifyLogin = (req, res, next) => {
  if (req.session.userlogedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}


/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  console.log(user);
  let cartCount = null
  if (req.session.user) {
    cartCount = await Helper.getCartCount(req.session.user._id)
  }
  productdata.getallProducts().then((products) => {
    res.render('user/user-products', { admin: false, products, user, cartCount })
  })
});
router.get('/login', (req, res) => {
  if (req.session.userlogedIn) {
    res.redirect('/')
  } else {

    res.render('user/login', { "loginErr": req.session.userloginErr })


    req.session.userloginErr = false
  }

})



router.get('/signup', (req, res) => {
  res.render('user/signup')

})
router.post('/signup', (req, res) => {
  Helper.doSignup(req.body).then((response) => {
    console.log(response)
    req.session.userlogedIn = true
    req.session.user = response
    res.redirect('/login')

  })

})
router.post('/login', (req, res) => {
  Helper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userlogedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.userloginErr = true

      res.redirect('/login')
    }

  })

})
router.get('/logout', (req, res) => {
  req.session.user=null
  req.session.userlogedIn=false
  res.redirect('/')
})
router.get('/cart', verifyLogin, async (req, res) => {
  
    let product = await Helper.getCartProduct(req.session.user._id)
    let totalValue=0
    if(product.length>0){
      
      totalValue=await Helper.getTotalAmount(req.session.user._id)
    }  
      
      
      let user=req.session.user._id
    res.render('user/cart', { product,totalValue, user: req.session.user._id })
    
      
    
   
    
  
  
})
router.get('/add-to-cart/:id',verifyLogin,(req, res) => {
  console.log("api call");
  Helper.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})

router.post('/change-product-quantity',(req,res,next)=>{
  Helper.changeProductQuantity(req.body).then(async(response)=>{
    
    let total=0
    let product = await Helper.getCartProduct(req.session.user._id)
    if(product.length>0){
      response.total=await Helper.getTotalAmount(req.body.user)
    }
    
    res.json(response)

  })
})
router.post('/remove-Products',(req,res,next)=>{
  Helper.removeProducts(req.body).then((response)=>{
    
    res.json(response)

  })
})
router.get('/user-details',verifyLogin,async (req, res) => {
  let total=await Helper.getTotalAmount(req.session.user._id)
  res.render('user/user-details',{total,user:req.session.user})
})
router.post('/user-details',async(req,res)=>{
  let totalPrice=0
  let product=await Helper.getProductList(req.body.userid)
  
  if(product.length>0){
    totalPrice=await Helper.getTotalAmount(req.body.userid)
  }
  
  Helper.placeOrder(req.body,product,totalPrice).then((orderId)=>{
    if(req.body['payment-method']=='COD'){
      res.json({codSuccess:true})
    }else{
      Helper.generateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response)

      })
    }
    

  })
  console.log(req.body);

})
router.get('/order-status',verifyLogin,(req, res) => {
  
  res.render('user/order-status',{user:req.session.user})
})
router.get('/view-orders',verifyLogin,async(req, res) => {
  let orders=await Helper.getUserOrders(req.session.user._id)
  console.log(orders);
  res.render('user/view-orders',{user:req.session.user,orders})
})
router.get('/orderd-products/:id',verifyLogin,async(req,res)=>{
  let products=await Helper.getOrderProducts(req.params.id)
  
  res.render('user/orderd-products',{user:req.session.user,products})
})

router.post('/verify-payment',(req,res)=>{
  Helper.verifyPayment(req.body).then(()=>{
    Helper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("payment successfull");
      res.json({status:true})
    })

  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:''})
  })
})
router.get('/forgott-pas',(req, res) => {
  
  res.render('user/forgott-pas',{user:req.session.user})
})





module.exports = router;
