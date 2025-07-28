import express from 'express';
import upload from '../middleware/multer.js'
import Mentee from '../models/mentee.js';
import uploadFileOnCloudinary from '../utils/uploadFilesOnCloudinary.js';
import jwt from 'jsonwebtoken'
import { protectMenteeRoute } from '../middleware/mentee.js';
import bcrypt from 'bcryptjs';
import Mentor from '../models/Mentor.js';

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
      description,
      confirmPassword,
     mentorshipInterests,
    } = req.body;

    //console.log(mentorshipInterests)

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }



const isMentee = await Mentee.findOne({email:email});
if(isMentee){
  return res.status(400).json({
    message:'This email is already registerd '
  })
}
    // Upload resume to Cloudinary
      const resumeBuffer = req.file?.buffer;
     // console.log(resumeBuffer)
    let resumeUrl = "";
    let resumePublicId = "";

        if (resumeBuffer) {
          //console.log("hi from resume buffer")
      // uploadFileOnCloudinary returns an object like { secure_url, public_id }
      const uploadResult = await uploadFileOnCloudinary(resumeBuffer, "resume.pdf");
      //console.log(uploadResult)
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
     description:description,
      password, // 🔐 Hash it later for security
    areaOfMentorshipInterest:  mentorshipInterests,
      resume: resumeUrl,
      resumePublicId:resumePublicId
    });
    //console.log(mentee)

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
});



router.use(protectMenteeRoute)

router.get('/getDashboardData',async(req,res)=>{
  try {
    //console.log(req.user)
    const mentee = await req.user.populate({
      path:'yourMentors',
      select:"-password -interestedMentees"
    })
    return res.status(200).json({
      mentee
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message:'Internal server error'
    })
  }
});

router.get('/availableMentors',async(req,res)=>{
  try {
  const interest = req.user.areaOfMentorshipInterest;
  //console.log(interest)
  const availableMentors = await Mentor.find({areaofMentorship:{$in:interest}}).select("_id fullName description areaofMentorship");
  //console.log(availableMentors)
  // if(availableMentors.length===0){
  //   return res.status(404).json({
  //     message:'Mentors of your interest are not available'
  //   })
  // }
  return res.status(200).json({
    availableMentors
  })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message:'Internal server error'
    })
  }
})

router.get("/mentor-detail/:id",async(req,res)=>{
  const mentorId = req.params.id;
  try {
    const mentor = await Mentor.findById(mentorId).select("_id areaofMentorship fullName description profilePicture");
    if(!mentor){
      return res.status(404).json({
        message:'Mentor not found'
      })
    }

    return res.status(200).json({
      mentor
    })

  } catch (error) {

    console.log(error);
    return res.status(500).json({
      message:'Internal server error'
    })
    
  }
})


router.post('/request-mentor/:id',async(req,res)=>{
   const mentorId = req.params.id;
  try {
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: 'This mentor does not exist' });
    }

    // Add mentee to mentor's interested list
    if (!mentor.interestedMentees.includes(req.user._id)) {
      await Mentor.updateOne(
  { _id: mentorId },
  { $addToSet: { interestedMentees: req.user._id } }
);
    }

    // Add mentor to mentee's list
    if (!req.user.yourMentors.includes(mentorId)) {
  await Mentee.updateOne(
  { _id: req.user._id },
  { $addToSet: { yourMentors: mentorId } }
);
    } 

    // Prepare data
    const mentorName = mentor.fullName;
    const mentorEmail = mentor.email;
    const mentorPhoneNumber = mentor.phoneNumber;
    const studentName = req.user.fullName;
    const studentMail = req.user.email;
    const studentPhoneNumber = req.user.phoneNumber;

    // Web3Forms integration
    const web3Res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: process.env.WEB3FORMS_KEY,
        subject: 'New Mentor Request',
        name: studentName,
        email: studentMail,
        message: `
        A new mentorship request has been submitted.

        👨‍🎓 Student Name: ${studentName}
        📧 Student Email: ${studentMail}
        📞 Student Phone: ${studentPhoneNumber}

        🧑‍🏫 Mentor Name: ${mentorName}
        📧 Mentor Email: ${mentorEmail}
        📞 Mentor Phone: ${mentorPhoneNumber}
        `
      }),
    });

    const web3Data = await web3Res.json();

    if (!web3Data.success) {
      console.error('Web3Forms Error:', web3Data);
      return res.status(500).json({
        message: 'Web3Forms failed',
        detail: web3Data.message
      });
    }

    return res.status(200).json({
      message: 'Mentor request submitted successfully!Our team will contact you shortly',
    });


  } catch (error) {
    console.error('Request Mentor Error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
})


export default router;