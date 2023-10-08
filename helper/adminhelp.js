var db=require('../config/connection')
var collection=require('../config/collection')
const { resolve, reject } = require('promise')
const bcrypt=require('bcrypt')
const { response } = require('../app')
const objectId=require('mongodb').ObjectId

module.exports={

    adduser:(user,callback)=>{
        console.log(user)
        let userobj={
            Name:user.Name,
            Phone:user.Phone,
            Address:user.Address,
            userid:objectId(user.userid),
            status:user.status,
            Stand:user.Stand,
            Type:user.Type
        }
        db.get().collection(collection.USERS_COLLECTION)
        .insertOne(userobj).then((data)=>{
            db.get().collection(collection.PENDING_COLLECTION).deleteOne({userid:objectId(user.userid)})
            callback(data.insertedId)
        })

    },
    getuser:()=>{
        return new Promise(async(resolve,reject)=>{
            let users=await db.get().collection(collection.USERS_COLLECTION)
            .find().toArray()
            resolve(users)
        })

    },
    doSignup:(admindata)=>{
        return new Promise(async(resolve,reject)=>{
            admindata.Pass= await bcrypt.hash(admindata.Pass,10)
            db.get().collection(collection.ADMIN_COLLECTION)
            .insertOne(admindata).then((data)=>{
                resolve(admindata)
            })

        })

    },
    dologin:(admindata)=>{
        return new Promise( async(resolve,reject)=>{
            let loginstatus=false
            let response={}
            let admin= await db.get().collection(collection.ADMIN_COLLECTION)
            .findOne({Email:admindata.Email})
            if(admin){
                bcrypt.compare(admindata.Pass,admin.Pass).then((status)=>{
                    if(status){
                        console.log('Success')
                        response.admin=admin
                        response.status=true
                        resolve(response)
                    }
                    else{
                        console.log(' Admin Failed')
                        resolve({status:false})
                    }
                })
            }else{
                console.log('Email Not Find')
                resolve({status:false})
            }
        })

    },
    getuserDetails:(userID)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USERS_COLLECTION).findOne({_id:objectId(userID)}).then((user)=>{
              resolve(user)
            })
          })

    },
    updateUser:(userid,userdetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USERS_COLLECTION).updateOne({_id:objectId(userid)},
            {
              $set:{
                Name:userdetails.Name,
                Phone:userdetails.Phone,
                Address:userdetails.Address,
                Stand:userdetails.Stand,
                Type:userdetails.Type
                
              }
              
            }).then((response)=>{
              resolve()
            })
          })

    },
    deleteuser:(userid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USERS_COLLECTION).deleteOne({_id:objectId(userid)}).then((response)=>{
              
              resolve(response)
              
              
      
            })
          })

    },
    getreq:()=>{
        return new Promise(async(resolve,reject)=>{
           let request= await db.get().collection(collection.PENDING_COLLECTION)
            .find().toArray()
            resolve(request)
        })
    },
    rejectuser:(userid)=>{
        return new Promise((resolve,reject)=>{
           db.get().collection(collection.PENDING_COLLECTION).deleteOne({_id:objectId(userid)})
           .then((response)=>{
            resolve(response)
           })
        })

    },rejectuser2:(userid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PENDING_COLLECTION).deleteOne({userid:objectId(userid)})
            .then((response)=>{
             resolve(response)
            })
         })

    },
    countPendingRequests:()=>{
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.PENDING_COLLECTION)
                .countDocuments({}, (error, count) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(count);
                    }
                });
        });
      },
      countUsers:()=>{
        return new Promise((resolve, reject) => {
            db.get()
                .collection(collection.USERS_COLLECTION)
                .countDocuments({}, (error, count) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(count);
                    }
                });
        });

      }
   
}