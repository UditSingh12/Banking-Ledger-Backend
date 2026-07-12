const userModel=require("../models/user.models")
const jwt=require("jsonwebtoken")


async function authMiddleware(req,res,next){
    const token=req.cookies.token || req.headers.authorization?.split(" ")[1]
    
    if(!token){
        return res.status(401).json({
            message:"Token is required for Authentication",
            status:"Failed"
        })
    }
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        const user=await userModel.findById(decoded.userId)

        req.user=user
        next()

    }
    catch(error){
        return res.status(401).json({
            message:"Unauthorized Access, Token is Invalid",
            status:"Failed"
        })

    }

}

module.exports={
    authMiddleware
}