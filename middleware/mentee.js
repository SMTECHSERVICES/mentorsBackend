import jwt from 'jsonwebtoken';
import Mentee from '../models/mentee.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET

export const protectMenteeRoute = async(req,res,next)=>{
   try {
     const accessToken = req.cookies.token;

    if(!accessToken){
        return res.status(401).json({
            message:'Please login to access this route'
        })
    }
    const decodedData = jwt.verify(accessToken,JWT_SECRET);
    const user = await Mentee.findById(decodedData.id).select("-password");
    if(!user){
        return res.status(404).json({
            message:'User does not exist'
        })
    }
    req.user = user;
    next()
   } catch (error) {
    console.log(error);
    return res.status(500).json({
        message:'Internal server error'
    })
   }
}