import express from 'express';
import jwt from 'jsonwebtoken'
import adminProtectMiddleware from '../middleware/admin.js';
import ExcelJS from 'exceljs'
import Mentee from '../models/mentee.js';
import Mentor from '../models/Mentor.js';
import upload from '../middleware/multer.js'
import uploadOnCloudinaryBuffer from '../utils/uploadImageOnCloudinary.js';
import Event from '../models/event.js';

const router = express.Router();


router.post('/login',async(req,res)=>{
    const {email,password} = req.body;
    if(email != process.env.ADMIN_EMAIL || password != process.env.ADMIN_PASSWORD){
        return res.status(400).json({
            message:"Invalid credentials"
        })
    }

    const token = jwt.sign(
               { id: process.env.ADMIN_EMAIL, role: "admin" },
               process.env.ADMIN_JWT_SECRET,
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

             return res.status(200).json({
                message:"weclome boss",
                admin:{
                    role:"admin"
                },
                token
             })
       
})

router.use(adminProtectMiddleware)

router.get('/getAllMentees',async(req,res)=>{
    try {
        const allMentess = await Mentee.find().select("-password");
        return res.status(200).json({
            allMentess
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:'Internal server error'
        })
    }
});

router.get('/getMentee-detail/:id',async(req,res)=>{
  
})

router.get('/getAllMentors',async(req,res)=>{
    try {
        const allMentors = await Mentor.find().select("-password");
        return res.status(200).json({
            allMentors
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:'Internal server error'
        })
    }
});

router.get('/allDashboardData', async (req, res) => {
  try {
    const mentees = await Mentee.find();
    const mentors = await Mentor.find();

    // Count
    const totalMentees = mentees.length;
    const totalMentors = mentors.length;

    // Interests
    const menteeInterests = [...new Set(mentees.flatMap(m => m.areaOfMentorshipInterest))];
    const mentorInterests = [...new Set(mentors.flatMap(m => m.areaofMentorship))];

    // Map: interest -> matching mentors
    const interestMentorMap = {};
    menteeInterests.forEach(interest => {
      const matchedMentors = mentors.filter(m => m.areaofMentorship.includes(interest));
      interestMentorMap[interest] = matchedMentors.map(m => m.fullName);
    });

    // Create Excel
    const workbook = new ExcelJS.Workbook();
    
    
    const mentorSheet = workbook.addWorksheet('Mentors Details');
    const menteeSheet = workbook.addWorksheet('Mentees Details');
    const interestsSheet = workbook.addWorksheet('Interests & Mentors');
    const summarySheet = workbook.addWorksheet('Summary');

     // ✅ 1. Mentor Sheet (Exclude picture/resume fields)
    mentorSheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phoneNumber', width: 20 },
      { header: 'Current Job', key: 'currentJob', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Areas of Mentorship', key: 'areaofMentorship', width: 50 },
      { header: 'Created At', key: 'createdAt', width: 25 }
    ];

    mentors.forEach(m => {
      mentorSheet.addRow({
        fullName: m.fullName,
        email: m.email,
        phoneNumber: m.phoneNumber,
        currentJob: m.currentJob,
        description: m.description,
        areaofMentorship: m.areaofMentorship.join(', '),
        createdAt: m.createdAt
      });
    });

    // ✅ 2. Mentee Sheet (Exclude resume/resumePublicId)
    menteeSheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phoneNumber', width: 20 },
      { header: 'Current Job', key: 'currentJob', width: 30 },
      { header: 'Education', key: 'education', width: 40 },
      { header: 'Areas of Interest', key: 'areaOfMentorshipInterest', width: 50 },
      { header: 'Created At', key: 'createdAt', width: 25 }
    ];

    mentees.forEach(m => {
      menteeSheet.addRow({
        fullName: m.fullName,
        email: m.email,
        phoneNumber: m.phoneNumber,
        currentJob: m.currentJob,
        education: m.education.join(', '),
        areaOfMentorshipInterest: m.areaOfMentorshipInterest.join(', '),
        createdAt: m.createdAt
      });
    });

    
    // ✅ 3. Interests Sheet
    interestsSheet.columns = [
      { header: 'Area of Interest', key: 'interest', width: 30 },
      { header: 'Available Mentors', key: 'mentors', width: 60 }
    ];
    for (const interest of menteeInterests) {
      interestsSheet.addRow({
        interest,
        mentors: interestMentorMap[interest].join(', ') || 'No mentors available'
      });
    }

    // ✅ 4. Summary Sheet
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 30 }
    ];
    summarySheet.addRow({ metric: 'Total Mentees', value: totalMentees });
    summarySheet.addRow({ metric: 'Total Mentors', value: totalMentors });
    summarySheet.addRow({ metric: 'Unique Mentee Interests', value: menteeInterests.length });
    summarySheet.addRow({ metric: 'Unique Mentor Interests', value: mentorInterests.length });


   

    // ✅ Send Excel
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=dashboard-data.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to generate Excel file' });
  }
});

router.get('/dashboardData',async(req,res)=>{
    try {
        const mentors = await Mentor.find().select("-password");
        const mentees = await Mentee.find().select("-password");

        const totalNumberofmentors = mentors.length;
        const totalNumberofMentees = mentees.length;

           const menteeInterests = [...new Set(mentees.flatMap(m => m.areaOfMentorshipInterest))];
    const mentorInterests = [...new Set(mentors.flatMap(m => m.areaofMentorship))];

      const interestMentorMap = {};
    menteeInterests.forEach(interest => {
      const matchedMentors = mentors.filter(m => m.areaofMentorship.includes(interest));
      interestMentorMap[interest] = matchedMentors.map(m => m.fullName);
    });

    return res.status(200).json({
        mentorInterests,
        mentors,
        mentees,
        totalNumberofMentees,
        totalNumberofmentors,
        interestMentorMap
    })
    } catch (error) {
        
    }
})

router.get('/events',async(req,res)=>{
  const page = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 2);
  const skip = (page - 1) * limit;
  const category = (req.query.category || "all");



  try {
    const totalNumberOfEvents = await Event.countDocuments();
    let events;
    if(category==="all"){
       events = await Event.find().skip(skip).limit(limit);
    }else{
        const isPublishValue = category.toLowerCase() === 'true';
      events = await Event.find({ isPublish: isPublishValue }).skip(skip).limit(limit);
    }

    return res.status(200).json({
      totalNumberOfEvents,
      totalPage : Math.ceil(totalNumberOfEvents/limit),
      currentPage:page,
      events
    })
  } catch (error) {
    console.log("Error in get event route",error);
    return res.status(500).json({
      message:'Internal server error'
    })
  }
})

router.post('/addNewEvent',upload.single("thumbnail"),async(req,res)=>{
  const {title,description,isPublish} = req.body;
  try {
    if(!title || !description){
      return res.status(404).json({
        message:'Please give the title and description'
      })
    }
     const thumbnailBuffer = req.file?.buffer;
     // console.log(resumeBuffer)
    let thumbnailUrl = "";
    let thumbnailUrlPublicId = "";

         if (thumbnailBuffer) {
      const logoUploadResult = await uploadOnCloudinaryBuffer(thumbnailBuffer);
      // Assuming uploadOnCloudinaryBuffer returns an object with url and public_id
      // If it returns just URL, adjust accordingly
      if (typeof logoUploadResult === 'string') {
        thumbnailUrl = logoUploadResult;
        // publicId not available in this case
      } else {
        thumbnailUrl = logoUploadResult.secure_url || "";
        thumbnailUrlPublicId = logoUploadResult.public_id || "";
      }
    }

    const newEvent = await Event.create({
      title:title,
      description:description,
      thumbnailurl:thumbnailUrl,
      thumbnailurlPublicId:thumbnailUrlPublicId,
      isPublish:isPublish
    })

     return res.status(201).json({
      message:"Event added successfully",
     })

  } catch (error) {
    console.log('error in add new events',error);
    return res.status(500).json({
      message:"Internal server error"
    })
  }
})

export default router;