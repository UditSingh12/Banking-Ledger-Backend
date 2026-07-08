const mongoose=require("mongoose")

const transactionSchema=new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true,"Transaction must be associated with from Account"],
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true,"Transaction must be associated with to Account"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["PENDING","COMPLETED","FAILED","REVERSED"],
            message: "Status can be either PENDING, COMPLETED, FAILED or REVERSED"
        },
        default: "PENDING"
    },
    amount: {
        type: Number,
        required: [true,"Amount is required for creating a Transaction"],
        min: [0,"Transaction amount can not be Negative"]
    },
    idempotencyKey: {
        type: String,
        required: [true,"Idempotency Key is require for creating a Transaction"],
        index: true,
        unique: true
    },
    timestamps: true
})
const transactionModel= mongoose.model("transaction",transactionSchema)

module.exports= transactionModel


