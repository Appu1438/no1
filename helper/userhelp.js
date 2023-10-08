var db=require('../config/connection')
var collection=require('../config/collection')
const bcrypt=require('bcrypt')
const { resolve, reject } = require('promise')
const { response } = require('../app')
const { ObjectId } = require('mongodb')
var objectid=require('mongodb').ObjectId
const Razorpay=require('razorpay')
const { promiseHooks } = require('v8')
var instance = new Razorpay({
    key_id: 'rzp_test_xC1qCIx8ibFqvF',
    key_secret: 'wIgwyduh2mfN1iubbTQlNqTU',
  });

module.exports={



    doSignup: (userdata) => {
        return new Promise(async (resolve, reject) => {
            // Check if the email already exists in the database
            const existingUser = await db.get().collection(collection.PROFILE_COLLECTION)
                .findOne({ Email: userdata.Email });
    
            if (existingUser) {
                // Email already exists, send an error message
                reject("Email already exists");
            } else {
                // Hash the password and insert the user data
                // userdata.Pass = await bcrypt.hash(userdata.Pass, 10);
                db.get().collection(collection.PROFILE_COLLECTION)
                    .insertOne(userdata)
                    .then((data) => {
                        resolve(userdata);
                    });
            }
        });
    },
    
    doLogin:(userdata)=>{
        return new Promise( async(resolve,reject)=>{
            let loginstatus=false
            let response={}
            let user= await db.get().collection(collection.PROFILE_COLLECTION)
            .findOne({Email:userdata.Email})
            if(user){
                bcrypt.compare(userdata.Pass,user.Pass).then((status)=>{
                    if(status){
                        console.log('Success')
                        response.user=user
                        response.status=true
                        resolve(response)
                    }
                    else{
                        console.log('Failed')
                        resolve({status:false})
                    }
                })
            }else{
                console.log('Email Not Find')
                resolve({status:false})
            }
        })

    },
    getprofileDetails:(userid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PROFILE_COLLECTION).findOne({_id:objectid(userid)}).then((user)=>{
              resolve(user)
            })
          })

    },
    updateprofile:(userid,pdetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PROFILE_COLLECTION).updateOne({_id:objectid(userid)},
            {
              $set:{
                Name:pdetails.Name,
                Phone:pdetails.Phone,
                Address:pdetails.Address,
                Emaill:pdetails.Email,
                Pincode:pdetails.Pincode
              }
            }).then((response)=>{
              resolve()
            })
          })

    },
    deleteuser:(userid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PROFILE_COLLECTION).deleteOne({_id:objectid(userid)}).then((response)=>{
              
              resolve(response)
              
              
      
            })
          })

    }
    ,
    register:(vehicle,callback)=>{
        let vehobj={
            user:objectid(vehicle.user),
            Name:vehicle.Name,
            Phone:vehicle.Phone,
            Address:vehicle.Address,
            Stand:vehicle.Stand,
            Type:vehicle.Type
        }
        console.log(vehicle)
        db.get().collection(collection.VEHICLE_COLLECTION).insertOne(vehobj)
        .then((data)=>{
            callback(data.insertedId)
        })

    },
    getvehicle:(userid)=>{
        console.log(userid)
        return new Promise(async(resolve,reject)=>{
            let vehicle=await db.get().collection(collection.VEHICLE_COLLECTION)
            .find({user:objectid(userid)}).toArray()
             console.log(vehicle)
                resolve(vehicle)
            })

    },
    getvehicledetails:(userid)=>{
        return new Promise(async(resolve,reject)=>{
            let vehicle=await db.get().collection(collection.VEHICLE_COLLECTION)
            .find({user:objectid(userid)}).toArray()
            resolve(vehicle)
        })

    },
    placeorder:(order,vehicle,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,vehicle,total)
            let status=order.Payment==='COD'?'Success':'Pending'
            let orobj={
                Name:order.Name,
                Phone:order.Phone,
                Email:order.Email,
                userid:objectid(order.userid),
                Payment:order.Payment,
                Vehicle:vehicle,
                Total:total,
                status:status,
                Date: new Date()
            }
            db.get().collection(collection.PENDING_COLLECTION)
            .insertOne(orobj).then((response)=>{
                resolve(response.insertedId)
            })
        })

    },
    generateRazorpay:(orderid,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(orderid)
            var options={
                amount:total*100,
                currency:'INR',
                receipt:orderid,
            }
            instance.orders.create(options,function(err,order){
                console.log('New:',order)
                resolve(order)
            })
        })

    },
    verifypayment:(details)=>{
        return new Promise((resolve,reject)=>{
          const crypto=require('crypto')
          let hmac=crypto.createHmac('sha256','wIgwyduh2mfN1iubbTQlNqTU')
      
          hmac.update(details[ 'payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
          hmac=hmac.digest('hex')
          if(hmac==details[ 'payment[razorpay_signature]']){
              resolve()
          }else{
              reject()
          }
        })
      },
      changepaystatus:(orderid)=>{
      return new Promise((resolve,reject)=>{
          db.get().collection(collection.PENDING_COLLECTION)
          .updateOne({_id:objectid(orderid)},
          {
              $set:{
                  status:'Success'
              }
          }).then(()=>{
              resolve()
          })
      })
      
      },
      getstatus:(userid)=>{ 
        return new Promise(async(resolve,reject)=>{
           let sts=await db.get().collection(collection.USERS_COLLECTION)
            .find({userid:objectid(userid)}).toArray()
            resolve(sts)
        })

      },
      UpdatePass:(data)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PROFILE_COLLECTION).updateOne({Email:data.Email},
                {
                    $set:{
                        Pass:data.Pass
                    }
                }).then((response)=>{
                    resolve()
                })
        })

      }
     
  
}