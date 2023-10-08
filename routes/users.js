var express = require('express');
var router = express.Router();
var adminhelp = require('../helper/adminhelp')
var userhelper = require('../helper/userhelp');
const { response } = require('../app');
const userhelp = require('../helper/userhelp');
var db = require('../config/connection')
var collection = require('../config/collection')

/* GET users listing. */
const verifylogin = (req, res, next) => {
  if (req.session.userloggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}
router.get('/',async(req, res) =>{
  let user = req.session.user
  res.render('user/index', { user, });
});
router.get('/auto', (req, res) => {
  let user = req.session.user

  adminhelp.getuser().then((users) => {

    res.render('user/auto', { users, user })

  })
})
router.get('/profile', verifylogin, async (req, res) => {
  let user = req.session.user
  let vehicle = await userhelp.getvehicle(req.session.user._id)
  let status = await userhelp.getstatus(req.session.user._id)
  console.log(status)
  if (status) {
    res.render('user/profile', { user, vehicle, status })

  } else {
    res.render('user/profile', { user, vehicle })
  }







})
router.get('/contact', (req, res) => {
  res.render('user/contact')
})
router.get('/login', (req, res) => {
  if (req.session.userloggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { 'LoginErr': req.session.userloginErr })
    req.session.userloginErr = false
  }

})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})

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
  const existingUser = await db.get().collection(collection.PROFILE_COLLECTION).findOne({ Email: userData.Email });

  if (existingUser) {
   
    res.render('user/signup', { error: 'Email already exists' });
  } else {
    // Generate and send OTP via email
    const otp = generateOTP();
    const mailOptions = {
      from: 'tuktukmallu@gmail.com',
      to: userData.Email,
      subject: 'Verification OTP',
      text: `Your OTP for TukTuk Registration is: ${otp}`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error(error);
        res.render('user/signup', { error: 'Error sending OTP. Please try again.' });
      } else {
   
        req.session.otp = otp;
        // console.log(req.session.otp)

        
        userData.Pass = await bcrypt.hash(userData.Pass, 10);

    
        res.render('user/verify', { email: userData.Email, otp, userData });
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
    userhelper.doSignup(req.body)
      .then((response) => {
        req.session.userloggedIn = true;
        req.session.user = response;
        res.redirect('/profile');
      })
      .catch((error) => {
        res.render('user/signup', { error: 'Error signing up. Please try again.' });
      });
  } else {
    // Invalid OTP, show an error message
    res.render('user/verify', { Email, error: 'Invalid OTP. Please try again.' });
  }
});

router.post('/resend-otp', async (req, res) => {
  const { Email } = req.body;
  const otp = generateOTP();
  const mailOptions = {
    from: 'tuktukmallu@gmail.com',
    to: Email,
    subject: 'Verification OTP (Resend)',
    text: `Your New OTP for TukTuk Registration is: ${otp}`,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Error Sending OTP. Please try again.' });
    } else {
      // Store the new OTP in the session for later verification
      req.session.otp = otp;
      res.json({ message: 'OTP Resent Successfully.' });
    }
  });
});
router.get('/forgot',(req,res)=>{
  res.render('user/forgot')
})
router.post('/forgot',(req,res)=>{
  const userData = req.body;
  
    // Generate and send OTP via email
    const otp = generateOTP();
    const mailOptions = {
      from: 'tuktukmallu@gmail.com',
      to: userData.Email,
      subject: 'Forgot Password',
      text: `Your OTP for Update TukTuk Password is: ${otp}`,
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error(error);
        res.render('user/forgot', { error: 'Error sending OTP. Please try again.' });
      } else {
   
        req.session.otp = otp;
        // console.log(req.session.otp)

        
        userData.Pass = await bcrypt.hash(userData.Pass, 10);

      
        res.render('user/verifypass', { email: userData.Email, otp, userData });
      }
    });
  
})
router.post('/verify-otp-pass', (req, res) => {
  const { Email, otp } = req.body;
  let storedOTP = req.session.otp;
  console.log(storedOTP)
  console.log(otp)
console.log(req.body)
  if (otp == storedOTP) {

    delete req.session.otp; 
    userhelper.UpdatePass(req.body)
      .then((response) => {
        res.redirect('/login');
      })
      .catch((error) => {
        res.render('user/forgot', { error: 'Error Updating Password. Please try again.' });
      });
  } else {
    // Invalid OTP, show an error message
    res.render('user/verifypass', { Email, error: 'Invalid OTP. Please try again.' });
  }
});
router.post('/resend-otp-pass', async (req, res) => {
  const { Email } = req.body;
  const otp = generateOTP();
  const mailOptions = {
    from: 'tuktukmallu@gmail.com',
    to: Email,
    subject: 'Forgot Password (Resend)',
    text: `Your New OTP for Update AutoBros Password is: ${otp}`,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Error Sending OTP. Please try again.' });
    } else {
      // Store the new OTP in the session for later verification
      req.session.otp = otp;
      res.json({ message: 'OTP Resent Successfully.' });
    }
  });
});




// router.post('/signup', (req, res) => {
//   userhelper.doSignup(req.body)
//       .then((response) => {
//           console.log(response);
//           req.session.userloggedIn = true;
//           req.session.user = response;
//           res.redirect('/profile');
//       })
//       .catch((error) => {
//           // Handle the error here, e.g., send an error message to the user
//           res.render('user/signup', { error: "Email already exists" });
//       });
// });

router.post('/login', (req, res) => {
  userhelper.doLogin(req.body).then((response) => {
    console.log(response)
    if (response.status) {
      req.session.userloggedIn = true
      req.session.user = response.user
      res.redirect('/profile')
    } else {
      req.session.userloginErr = "Invalid Username Or Password"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})
router.get('/register', verifylogin, (req, res) => {
  let user = req.session.user
  res.render('user/register', { user })
})

router.post('/register', (req, res) => {
  userhelp.register(req.body, (id) => {
    console.log(id)
    let Vimage = req.files.VImage
    let Dimage = req.files.DImage
    let Rimage = req.files.RImage

    Vimage.mv('./public/vimages/' + id + '.jpg', (err, done) => {
      if (!err) {
        // res.redirect('/profile')
      } else {
        console.log(err)
      }
    })
    Dimage.mv('./public/limages/' + id + '.jpg', (err, done) => {
      if (!err) {
        // res.redirect('/profile')
      } else {
        console.log('D' + err)
      }
    })
    Rimage.mv('./public/dimage/' + id + '.jpg', (err, done) => {
      if (!err) {
        // res.redirect('/profile')
        // res.render('admin/adduser',{admin:true,admins})
      } else {
        console.log('R' + err)
      }
    })
    res.render('user/index')

  })
})

router.get('/editprofile/:id', async (req, res) => {
  console.log(req.params.id)
  let profile = await userhelp.getprofileDetails(req.params.id)
  console.log(profile)
  res.render('user/editprofile', { profile })
})
router.post('/editprofile/:id', (req, res) => {
  userhelp.updateprofile(req.params.id, req.body).then(() => {

    res.redirect('/profile')
  })

})
router.get('/deleteprofile/:id', (req, res) => {
  let userID = req.params.id
  console.log(userID)
  userhelp.deleteuser(userID).then(() => {
    res.redirect('/')
  })
})
router.get('/checkout', verifylogin, (req, res) => {
  let user = req.session.user
  let total = 10
  res.render('user/payment', { user, total })
})
router.post('/checkout', async (req, res) => {
  let total = 10
  let vehicle = await userhelp.getvehicledetails(req.body.userid)
  userhelp.placeorder(req.body, vehicle, total).then((orderid) => {
    if (req.body['Payment'] === 'COD') {
      res.json({ codsuccess: true })
    } else {
      res.json({ codsuccess: true })
      // userhelp.generateRazorpay(orderid, total).then((response) => {
      //   res.json(response)
      // })
    }
  })

})
router.get('/placed', (req, res) => {
  res.render('user/placed', { user: req.session.user })
})
router.post('/verifypayment', (req, res) => {
  console.log(req.body)
  userhelp.verifypayment(req.body).then(() => {
    userhelp.changepaystatus(req.body['order[receipt]']).then(() => {
      console.log('Payment Success')
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err)
    res.json({ status: false, errMsg: '' })
  })
})
// Add this route handler after your existing routes
router.post('/submit-form', (req, res) => {
  const formDetails = req.body; // Assuming the form data is in req.body

  // Create an email message with the form data
  const mailOptions = {
    from: 'tuktukmallu@gmail.com',
    to: 'tuktukmallu@gmail.com', // Your Gmail address
    subject: 'TUKTUK ENQUIRY MESSAGE',
    html: `
      <h2>ENQUIRY DETAILS</h2>
      <h2><h2>Name:</h2> ${formDetails.w3lName}</h2>
      <h2><h2>Email:</h2> ${formDetails.w3lSender}</h2>
      <h2><h2>Subject:</h2> ${formDetails.w3lSubect}</h2>
      <h2><h2>Message:</h2> ${formDetails.w3lMessage}</h2>
    `,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      // Handle email sending errors here
      res.status(500).send('Internal Server Error');
    } else {
      // Email sent successfully
      console.log('Email sent: ' + info.response);
      // You can redirect the user or send a success response here
      res.status(200).redirect('/contact');
    }
  });
});







module.exports = router;
