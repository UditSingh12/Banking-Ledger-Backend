const mongoose=require("mongoose");

const accountSchema= new mongoose.Schema({
    user:{
        type: mongoose.Schema.type.ObjectId,
        ref: "user",
        required:[true,"Account must be associated with a user"],
        index:true 
    },
    status:{
        enum:{
            values:["ACTIVE","FROZEN","CLOSED"],
            message:"Status can be either ACTIVE, FROZEN or CLOSED"
        }
    },
    currency:{
        type: String,
        required: [true,"Currency is require for Creating an Account"],
        default: "INR"
    }
},{
    timestamps:true
})
accountSchema.index({user:1,status:1})

const accountModel=mongoose.model("accounts",accountSchema)

module.exports=accountModel

