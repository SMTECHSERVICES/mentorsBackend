import jwt from 'jsonwebtoken';
import Mentor from '../models/Mentor.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const protectMentorMiddleware = async(req,res,next)=>{
    try {
        const accessToken = req.cookies.token;
         if(!accessToken){
        return res.status(401).json({
            message:'please login to access '
        })}

        const decodedData = jwt.verify(accessToken,JWT_SECRET);
        
        const user = await Mentor.findById(decodedData.id).select("-password");
        if(!user){
            return res.status(404).json({
                message:'user not found'
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