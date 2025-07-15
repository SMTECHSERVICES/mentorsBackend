import express from 'express';
import upload from '../middleware/multer.js'
import Mentor from '../models/Mentor.js';
import uploadFileOnCloudinary from '../utils/uploadFilesOnCloudinary.js';
import uploadOnCloudinaryBuffer from '../utils/uploadImageOnCloudinary.js';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/register',upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "profilePicture", maxCount: 1 },
]),async(req,res)=>{
   try {
    const {
      fullName,
      education,
      currentJob,
      email,
      phone,
      password,
      description,
      confirmPassword,
      mentorshipInterests,
    } = req.body;

    console.log(req.body)

 


   const resumeFile = req.files?.resume?.[0];
    const profilePicFile = req.files?.profilePicture?.[0];

    let profilePicUrl = "";
    let profilePicPublicId = "";
    let resumeUrl = "";
    let resumePublicId = "";

    // Upload company document (PDF)
    if (resumeFile?.buffer) {
      const docUploadResult = await uploadFileOnCloudinary(resumeFile.buffer, resumeFile.originalname);
      resumeUrl = docUploadResult.secure_url;
      resumePublicId = docUploadResult.public_id;
    }
    
    // Upload company logo (image)
    if (profilePicFile?.buffer) {
      const logoUploadResult = await uploadOnCloudinaryBuffer(profilePicFile.buffer);
      // Assuming uploadOnCloudinaryBuffer returns an object with url and public_id
      // If it returns just URL, adjust accordingly
      if (typeof logoUploadResult === 'string') {
        profilePicUrl = logoUploadResult;
        // publicId not available in this case
      } else {
        profilePicUrl = logoUploadResult.secure_url || "";
        profilePicPublicId = logoUploadResult.public_id || "";
      }
    }


    // Create Mentor entry
    const mentor = new Mentor({
      fullName,
      education,
      currentJob,
      email:email,
      description:description,
     phoneNumber: phone,
      password, // 🔐 Hash it later for security
    areaofMentorship: mentorshipInterests,
      resume: resumeUrl,
      resumePublicId:resumePublicId,
      profilePicture:profilePicUrl,
      profilePicPublicId:profilePicPublicId
    });

    await mentor.save();
    console.log(mentor)

   const token = jwt.sign(
           { id: mentor._id, role: mentor.role },
           process.env.JWT_SECRET,
           { expiresIn: "7d" }
         );
   
         // === Set HTTP-only cookie ===
         res.cookie("token", token, {
           httpOnly: true,
           secure: process.env.NODE_ENV === "production",
           sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
           path: "/",
           maxAge: 7 * 24 * 60 * 60 * 1000,
         });
   

    res.status(201).json({ msg: "Mentor registered successfully", mentor:{
      fullName:mentor.fullName,
      email:mentor.email,
      role:mentor.role
    } ,token}); 
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ msg: "Server error", error });
  }
});


router.post('/login',async(req,res)=>{
  const {email,password} = req.body;
  try {
    if(!email || !password){
      return res.status(400).json({
        message:"please provide main and password"
      })
    }

    console.log(email,password)

    const isMentor = await Mentor.findOne({
      email:email
    });
    console.log(isMentor)
    if(!isMentor){
      return res.status(400).json({
        message:'Invalid email'
      })
    }
    const isMatch = await bcrypt.compare(password,isMentor.password);
    if(!isMatch){
      return res.status(400).json({
        message:'invalid password'
      })
    }
    console.log(isMatch)

    const token = jwt.sign(
           { id: isMentor._id, role: isMentor.role },
           process.env.JWT_SECRET,
           { expiresIn: "7d" }
         );
   
         // === Set HTTP-only cookie ===
         res.cookie("token", token, {
           httpOnly: true,
           secure: process.env.NODE_ENV === "production",
           sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
           path: "/",
           maxAge: 7 * 24 * 60 * 60 * 1000,
         });
   

    res.status(201).json({ msg: "Mentor login successfully", mentor:{
      fullName:isMentor.fullName,
      email:isMentor.email,
    }, role:isMentor.role,token }); 

  } catch (error) {
    
  console.error("Login error:", error);
  res.status(500).json({ message: "Server error" });

  }
})


 

export default router;