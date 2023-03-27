const { response } = require('express');
var express = require('express');
var router = express.Router();
var productdata = require('../products-data/product-data')
const Helper = require('../helpers/admin-data');
const session = require('express-session');
const averifyLogin = (req, res, next) => {
  if (req.session.adminlogedIn) {
    next()
  } else {
    res.redirect('/admin/admin-login')
  }
}






router.get('/',averifyLogin, function (req, res, next) {
  let superadmin = req.session.admin
  console.log("superadmin",superadmin);
  if(superadmin){
    productdata.getallProducts().then((products) => {
      res.render('admin/view-products', { admin: true, products,superadmin})
    })
  }

});
router.get('/add-products',averifyLogin,(req, res) => {
  let superadmin = req.session.admin
  if(superadmin){
    res.render('admin/add-products', {admin: true,superadmin})
  }
  

})
router.post('/add-products', (req, res) => {
  console.log(req.body)
  console.log(req.files.image);


  productdata.addproduct(req.body, (insertedId) => {

    let image = req.files.image
    const imageName = insertedId
    console.log(insertedId);
    image.mv('./public/product-images/' + imageName + '.jpg', (err, done) => {

      if (!err)
        res.render('admin/add-products', { superadmin: true })
      else
        console.log(err);


    })

  })
})


router.get('/delete-product/:id', (req, res) => {
  let proid = req.params.id
  console.log(proid);
  productdata.deleteProduct(proid).then((response) => {
    res.redirect('/admin')
  })

})

router.get('/edit-product/:id',averifyLogin, async (req, res) => {
  let superadmin = req.session.admin
  let product = await productdata.getProductDetails(req.params.id)
  console.log(product);
  if(superadmin){
    res.render('admin/edit-product', { admin: true, product,superadmin })
  }
  
})
router.post('/edit-product/:id', (req, res) => {
  console.log(req.params.id);
  let id = req.params.id
  productdata.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin')
    if (req.files.image) {
      let image = req.files.image
      image.mv('./public/product-images/' + id + '.jpg')
    }
  })
})

router.get('/admin-login', (req, res) => {
  if (req.session.adminlogedIn) {
    res.redirect('/admin')
  } else {

    res.render('admin/admin-login',{ admin: true , "loginErr": req.session.adminloginErr })


    req.session.adminloginErr = false
  }

})

router.get('/admin-signup', (req, res) => {
  res.render('admin/admin-signup',{ admin: true })

})
router.post('/admin-signup', (req, res) => {
 
  Helper.adoSignup(req.body).then((response) => {
    console.log(response)
    req.session.adminlogedIn = true
    req.session.admin = response
    res.redirect('/admin/admin-login')

  }) 
  
})
router.post('/admin-login', (req, res) => {
  Helper.adoLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminlogedIn = true
      req.session.admin = response.admin
      console.log(req.session.admin);
      res.redirect('/admin')
    } else {
      req.session.adminloginErr = true

      res.redirect('/admin/admin-login')
    }

  })

})
router.get('/admin-logout', (req, res) => {
  req.session.admin=null
  req.session.adminlogedInlogedIn=false
  res.redirect('/admin')
})

router.get('/admin-orders',averifyLogin,(req,res)=>{
  let superadmin = req.session.admin
   productdata.getPlacedOrders().then((orders)=>{
    
    res.render('admin/admin-orders',{admin: true,orders,superadmin})
   })
    
})
router.get('/shipment-Status/:id',averifyLogin, async (req, res) => {
  let superadmin = req.session.admin
  let order = await productdata.getOrderstatus(req.params.id)
  console.log("order",order);
  
  if(superadmin){
    res.render('admin/shipment-Status', { admin: true,order,superadmin })
  }
  
})

router.post('/shipment-Status/:id', (req, res) => {
  
  productdata.updateStatus(req.params.id, req.body).then(() => {
   
    console.log("updated");
    res.redirect('/admin/admin-orders')
  })
})
router.get('/deliverd-orders',averifyLogin,(req,res)=>{
  let superadmin = req.session.admin
   productdata.getDeliverdOrders().then((orders)=>{
    if(superadmin){
      res.render('admin/deliverd-orders',{admin: true,orders,superadmin})
    }
    
   })
    
})
router.get('/allOrders',averifyLogin,(req,res)=>{
  let superadmin = req.session.admin
   productdata.getallOrders().then((orders)=>{
    if(superadmin){
    res.render('admin/allOrders',{admin: true,orders,superadmin})
    }
   })
    
})



module.exports = router;
