// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const mentorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 8 characters'],
    
  },
  currentJob: {
    type: String,
    required: [true, 'Current job title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  areaofMentorship: {
    type: [String],
    required: [true, 'At least one mentorship area is required'],
    // enum: {
    //   values: ['Career', 'Technology', 'Business', 'Education', 'Leadership', 'Personal Development'],
    //   message: '{VALUE} is not a valid mentorship area'
    // }
  },
  resume: {
    type: String, // URL to resume file
    required: [true, 'Resume link is required'],
    trim: true
  },
  resumePublicId:{
    type:String,
    select:false
  },
  profilePicture: {
    type: String, // URL to profile image
    default: 'https://example.com/default-avatar.jpg',
    trim: true
  },
  profilePicPublicId:{
    type:String,
    select:false
  },
    role:{
    type:String,
    default:'mentor'
  },
  interestedMentees:[
    {
      type:mongoose.Types.ObjectId,
      ref:'Mentee'
    }
  ]

}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Password hashing middleware
mentorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt with 12 rounds
    const salt = await bcrypt.genSalt(12);
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
mentorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Mentor = mongoose.model('Mentor', mentorSchema);

export default Mentor