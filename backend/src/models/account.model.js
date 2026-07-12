const mongoose=require("mongoose");

const accountSchema= new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required:[true,"Account must be associated with a user"],
        index:true 
    },
    status:{
        type:"String",
        enum:{
            values:["ACTIVE","FROZEN","CLOSED"],
            message:"Status can be either ACTIVE, FROZEN or CLOSED",
        },
        default: "ACTIVE"
    },
    currency:{
        type: String,
        required: [true,"Currency is require for Creating an Account"],
        default: "INR"
    }
},{
    timestamps:true
})
accountSchema.index({user:1,status:1}) //Multi-Level Indexing

const accountModel=mongoose.model("accounts",accountSchema)

module.exports=accountModel

