
//  $("#checkoutform").submit((e)=>{
//   e.preventDefault()
//   $.ajax({
//     url:'/checkout',
//     method:'post',
//     data:$('#checkoutform').serialize(),
//     success:(response)=>{
//       if(response.codsuccess){
//         location.href='/placed'
//       }else{
//         razorpayPayment(response)
//       }
//     }
//   })
// })
