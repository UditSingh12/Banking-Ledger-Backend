const userModel=require("../models/user.models")
const jwt=require("jsonwebtoken")
const emailService=require("../services/email.service")

/** 
* - User Register Controller
* - POST /api/auth/register
*/

async function userRegisterController(req,res){
    const { email, name, password } = req.body || {};

    if (!email || !name || !password) {
        return res.status(400).json({
            message: "Email, name, and password are required",
            status: "Failed"
        });
    }

    try {
        const isExist = await userModel.findOne({ email });
        if (isExist) {
            return res.status(422).json({
                message: "User already Exists with Email",
                status: "Failed"
            });
        }

        const user = await userModel.create({ email, name, password });
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "14d" });

        res.cookie("token", token);

        try {
            await emailService.sendRegistrationEmail(user.email, user.name);
        } catch (emailError) {
            console.error("Registration email failed:", emailError.message);
        }

        return res.status(201).json({
            _id: user._id,
            email: user.email,
            name: user.name
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: "Failed"
        });
    }
}
/** 
* - User Login Controller
* - POST /api/auth/login
*/
async function userLoginController(req,res){
    const {email,password}=req.body

    const user=await userModel.findOne({email}).select("+password")

    if(!user){
        return res.status(401).json({
            message: "Email is Invalid/Not Registered"
        })
    }

    const isValidPassword=await user.comparePassword(password)

    if(!isValidPassword){
        return res.status(401).json({
            message: "Password is INVALID"
        })
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "14d" });

    res.cookie("token", token);

    return res.status(201).json({
            _id: user._id,
            email: user.email,
            name: user.name
    });
    
}
module.exports={
    userRegisterController,
    userLoginController
}

    
        

    
    
