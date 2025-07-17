import express from 'express';
import upload from '../middleware/multer.js'
import Mentee from '../models/mentee.js';
import uploadFileOnCloudinary from '../utils/uploadFilesOnCloudinary.js';
import jwt from 'jsonwebtoken'

const router = express.Router();

router.post('/register',upload.single("resume"),async(req,res)=>{
   try {
    const {
      fullName,
      education,
      currentJob,
      email,
     phone,
      password,
      confirmPassword,
     mentorshipInterests,
    } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }
console.log("Cloudinary ENV:", {
  name: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET
});
    // Upload resume to Cloudinary
      const resumeBuffer = req.file?.buffer;
      console.log(resumeBuffer)
    let resumeUrl = "";
    let resumePublicId = "";

        if (resumeBuffer) {
          console.log("hi from resume buffer")
      // uploadFileOnCloudinary returns an object like { secure_url, public_id }
      const uploadResult = await uploadFileOnCloudinary(resumeBuffer, "resume.pdf");
      console.log(uploadResult)
      resumeUrl = uploadResult.secure_url;
      resumePublicId = uploadResult.public_id;
    }


    // Create Mentor entry
    const mentee = new Mentee({
      fullName,
      education,
      currentJob,
      email,
     phoneNumber: phone,
      password, // 🔐 Hash it later for security
    areaOfMentorshipInterest:  mentorshipInterests,
      resume: resumeUrl,
      resumePublicId:resumePublicId
    });
    console.log(mentee)

    await mentee.save();
    const token = jwt.sign(
        { id: mentee._id, role: mentee.role },
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

    res.status(201).json({ msg: "mentee registered successfully", mentee:{
      fullName:mentee.fullName,
      email:mentee.email,
      role:mentee.role
    },token });
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

    const isMentee = await Mentee.findOne({
      email:email
    });
    if(!isMentee){
      return res.status(400).json({
        message:'Invalid email'
      })
    }
    const isMatch = await bcrypt.compare(password,isMentee.password);
    if(!isMatch){
      return res.status(400).json({
        message:'invalid password'
      })
    }

    const token = jwt.sign(
           { id: isMentee._id, role: isMentee.role },
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
   

    res.status(201).json({ msg: "Mentee login successfully", mentee:{
      fullName:isMentee.fullName,
      email:isMentee.email,
    },role:isMentee.role,token }); 

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message:'internal server error'
    })
  }
})



export default router;