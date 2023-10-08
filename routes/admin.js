var express = require('express');
var router = express.Router();
var adminhelp=require('../helper/adminhelp');
const userhelp = require('../helper/userhelp');
var db = require('../config/connection')
var collection = require('../config/collection')


/* GET home page. */
const verifylogin=(req,res,next)=>{
  if(req.session.adminloggedIn){
    next()
  }else{
    res.redirect('/admin/login')
  }
}
router.get('/', verifylogin,async(req, res, next) =>{
 
  let admins=req.session.admin
  let count=await adminhelp.countPendingRequests()
  let usercount=await adminhelp.countUsers()
  console.log(count)
  console.log(usercount)
    res.render('admin/index',{admin:true,admins,count,usercount});
  });
  router.get('/users',verifylogin,async(req,res)=>{
    let admins=req.session.admin
    let count=await adminhelp.countPendingRequests()
    let usercount=await adminhelp.countUsers()
    adminhelp.getuser().then((users)=>{
        res.render('admin/users',{admin:true,users,admins,count,usercount})
    })

   
  })
  router.get('/profile',verifylogin,async(req,res)=>{
    let admins=req.session.admin
    let count=await adminhelp.countPendingRequests()
    let usercount=await adminhelp.countUsers()
    res.render('admin/profile',{admin:true,admins,count,usercount})
  })
  router.get('/contact',async(req,res)=>{
    let count=await adminhelp.countPendingRequests()
    let usercount=await adminhelp.countUsers()
    res.render('admin/contact',{admin:true,count,usercount})
  })
  router.get('/adduser',verifylogin,async(req,res)=>{
    let admins=req.session.admin
    let count=await adminhelp.countPendingRequests()
    let usercount=await adminhelp.countUsers()
    res.render('admin/adduser',{admin:true,admins,count,usercount})
  })
  router.post('/add-user',(req,res)=>{
    let admins=req.session.admin
    adminhelp.adduser(req.body,(id)=>{
        let Vimage=req.files.VImage
        let Dimage=req.files.DImage
        let Rimage=req.files.RImage
        
       
        Vimage.mv('./public/userimages/'+id+'.jpg',(err,done)=>{
            if(!err){
            
             }else{
                console.log(err)
            }
        })
        Dimage.mv('./public/licenseimages/'+id+'.jpg',(err,done)=>{
           if(!err){
            
          }else{
            console.log('D'+err)
          }
        })
        Rimage.mv('./public/driverimages/'+id+'.jpg',(err,done)=>{
          if(!err){
              
          }else{
              console.log('R'+err)
          }
      })
      res.render('admin/index',{admin:true,admins})
    })
  })
  router.get('/login',(req,res)=>{
    if(req.session.adminloggedIn){
      res.redirect('/admin',{admin:true})
    }else{
      res.render('admin/login',{'LoginErr':req.session.adminloginErr,admin:true})
       req.session.adminloginErr=false
    }
  })
  router.get('/signup',(req,res)=>{
    res.render('admin/signup',{admin:true})
  })
  // router.post('/signup',(req,res)=>{
  //   adminhelp.doSignup(req.body).then((response)=>{
  //     console.log(response)
  //     req.session.adminloggedIn=true
  //     req.session.admin=response
  //     res.redirect('/admin')
      
  //   })
  
  
  // })
  const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { route } = require('./admin');

// Function to generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Create a transporter to send emails (use your email provider's SMTP details)
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'tuktukmallu@gmail.com',
    pass: 'sbgb tvzp vtrm jwor',
  },
});

router.post('/signup', async (req, res) => {
  const userData = req.body;
  const existingUser = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: userData.Email });

  if (existingUser) {
   
    res.render('admin/signup', { error: 'Email already exists' });
  } else {
    // Generate and send OTP via email
    const otp = generateOTP();
    const mailOptions = {
      from: 'tuktukmallu@gmail.com',
      to: 'tuktukmallu@gmail.com',
      subject: 'Admin Verification OTP',
      text: `Your OTP for TukTuk Admin Registration is: ${otp}`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error(error);
        res.render('admin/signup', { error: 'Error sending OTP. Please try again.' });
      } else {
   
        req.session.otp = otp;
        // console.log(req.session.otp)

        
        userData.Pass = await bcrypt.hash(userData.Pass, 10);

    
        res.render('admin/verify', { email: userData.Email, otp, userData });
      }
    });
  }
});

router.post('/verify-otp', (req, res) => {
  const { Email, otp } = req.body;
  let storedOTP = req.session.otp;
  console.log(storedOTP)
  console.log(otp)

  if (otp == storedOTP) {

    delete req.session.otp; 
    adminhelp.doSignup(req.body).then((response)=>{
      console.log(response)
      req.session.adminloggedIn=true
      req.session.admin=response
      res.redirect('/admin')
      
    })
      .catch((error) => {
        res.render('admin/signup', { error: 'Error signing up. Please try again.' });
      });
  } else {
    // Invalid OTP, show an error message
    res.render('admin/verify', { Email, error: 'Invalid OTP. Please try again.' });
  }
});
  router.post('/login',(req,res)=>{
    adminhelp.dologin(req.body).then((response)=>{
      console.log(response)
      if(response.status){
        req.session.adminloggedIn=true
        req.session.admin=response.admin
        res.redirect('/admin')
      }else{
        req.session.adminloginErr="Invalid Admin"
        res.redirect('/admin/login')
      }
    })
  })
  router.get('/logout',(req,res)=>{
    req.session.destroy()
    res.redirect('/admin')
  })
  router.get('/edituser/:id',async(req,res)=>{
    let user= await adminhelp.getuserDetails(req.params.id)
    let admins=req.session.admin
    let count=await adminhelp.countPendingRequests()
    let usercount=await adminhelp.countUsers()
    console.log(user)
    res.render('admin/edit',{admin:true,user,admins,count,usercount})
  })
  router.post('/edit-user/:id',(req,res)=>{
    adminhelp.updateUser(req.params.id,req.body).then(()=>{
      if(req.files.VImage){
         let vimage=req.files.VImage
         vimage.mv('./public/userimages/'+req.params.id+'.jpg')
   
       }
       if(req.files.DImage){
        let dimage=req.files.DImage
        dimage.mv('./public/licenseimages/'+req.params.id+'.jpg')
  
      }
      if(req.files.RImage){
        let rimage=req.files.RImage
        rimage.mv('./public/driverimages/'+req.params.id+'.jpg')
  
      }
       res.redirect('/admin')
     })

  })
  router.get('/deleteuser/:id',(req,res)=>{
    let userID=req.params.id
    console.log(userID)
    adminhelp.deleteuser(userID).then(()=>{
      res.redirect('/admin/users')
    })
  })
  router.get('/pending',verifylogin,async(req,res)=>{
    let admins=req.session.admin
    let count=await adminhelp.countPendingRequests()
    let usercount=await adminhelp.countUsers()
    adminhelp.getreq().then((request)=>{
      res.render('admin/pending',{admin:true,admins,request,count,usercount})
 
    })
    })
    router.get('/viewmore/:id',async(req,res)=>{
      let admins=req.session.admin
      let count=await adminhelp.countPendingRequests()
      let vehicle=await userhelp.getvehicle(req.params.id)
      let usercount=await adminhelp.countUsers()
      res.render('admin/view-vehicle',{admin:true,admins,vehicle,count,usercount})
    })
    router.get('/reject/:id',(req,res)=>{
      adminhelp.rejectuser(req.params.id).then(()=>{
        res.redirect('/admin/pending')
      })
      
    })
    router.get('/accept/:id',async(req,res)=>{
      let admins=req.session.admin
      let count=await adminhelp.countPendingRequests()
      let usercount=await adminhelp.countUsers()
      let vehicle=await userhelp.getvehicle(req.params.id)
      // adminhelp.rejectuser2(req.params.id).then(()=>{

      // })
      res.render('admin/accept',{admin:true,admins,vehicle,count,usercount})

    })

  
  
module.exports = router;
