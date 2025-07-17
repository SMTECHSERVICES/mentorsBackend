import express from 'express';
import upload from '../middleware/multer.js';
import uploadOnCloudinaryBuffer from '../utils/uploadImageOnCloudinary.js';
import Course from '../models/course.js';

const router = express.Router();

router.post('/uploadCourse', upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, ExplorePoints } = req.body;

    if (!title || !description || !ExplorePoints || !req.file) {
      return res.status(400).json({ message: 'All fields including image are required' });
    }

    const cloudinaryResult = await uploadOnCloudinaryBuffer(req.file.buffer);

    const course = new Course({
      title: title.trim(),
      description,
      ExplorePoints,
      thumbnail: cloudinaryResult.secure_url,
      tumbnailPublicId: cloudinaryResult.public_id,
      availableMentors: []
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course uploaded successfully',
      course
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get("/getCourses",async(req,res)=>{
    try {
        const serviceData = await Course.find().select("-tumbnailPublicId");

        return res.status(200).json(
            serviceData
        )
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:'Internal server error'
        })
    }
})



export default router