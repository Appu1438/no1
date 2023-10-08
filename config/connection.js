const {MongoClient}= require('mongodb')

const state={
    db:null
}
module.exports.connect=function(done){
    const dbname='autobros'
    MongoClient.connect('mongodb://0.0.0.0:27017/',(err,data)=>{
        if (err) return done(err)
        state.db=data.db(dbname)
    done()
    })
}
module.exports.get=function(){
    return state.db
}
   