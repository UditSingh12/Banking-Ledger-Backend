const express=require("express")
const authMiddleware=require("../middlewares/auth.middleware")
const accountController=require("../controllers/account.controllers")


const router=express.Router();

/**
 * - POST /api/account
 * - Create a new account
 * - Protected Route
 */

router.post("/",authMiddleware.authMiddleware,accountController.createAccount)



module.exports=router