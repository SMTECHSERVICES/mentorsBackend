import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const menteeSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  education: {
    type: [String],
    required: [true, 'Education details are required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'At least one education entry is required'
    }
  },
  currentJob: {
    type: String,
    required: [true, 'Current job is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    
  },
  areaOfMentorshipInterest: {
    type: [String],
    required: [true, 'At least one mentorship interest is required'],
 
  },
  resume: {
    type: String,
    required: [true, 'Resume URL is required'],
    trim: true
  },
  resumePublicId:{
    type:String,
    select:false
  },
  yourMentors:[
    {
      type:mongoose.Types.ObjectId,
      ref:'Mentor'
    }

  ],
  role:{
    type:String,
    default:'mentee'
  }
}, {
  timestamps: true
});

// Password hashing middleware
menteeSchema.pre('save', async function(next) {
  // Only hash if password is modified or new
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password comparison method
menteeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Mentee = mongoose.model('Mentee', menteeSchema);

export default Mentee