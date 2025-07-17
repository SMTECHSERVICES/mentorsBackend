import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
// import contactRoutes from './routes/contact.js';
import mentorRoutes from './routes/mentor.js'
import menteeRoutes from './routes/mentee.js'
import adminRoutes from './routes/admin.js';
import courseRoutes from './routes/course.js'


dotenv.config();

const app = express();
const port = process.env.PORT || 5000;


 const allowedOrigins = ['http://localhost:5173', 'http://localhost:4173','https://www.mentors.ind.in'];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())



// Connect MongoDB
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('connected to database')

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

// Simple Route to test server

//app.use('/api/contact', contactRoutes);
app.use('/api/mentor', mentorRoutes);
 app.use('/api/mentee', menteeRoutes);
 app.use("/api/course",courseRoutes)
 app.use('/api/admin',adminRoutes);

 app.get('/',(req,res)=>{
  res.json('sab janga si ')
 })

// Import and use routes here (contact route will come next)


// Start server
app.listen(port, () => console.log('Server started on port 5000'));







