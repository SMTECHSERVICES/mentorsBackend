import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    thumbnailurl:{
        type:String,
        required:true
    },
    thumbnailurlPublicId:{
        type:String,
        select:false
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    seminarDate:{
        type:Date,
        required:true
    },
    where:{
        type:String,
         required: true
    },
    timing:{
        type:String
    },
    isPublish:{
        type:Boolean,
        default:false
    },
    registredStudent:[
         {
              type:mongoose.Types.ObjectId,
              ref:'Mentee'
            }
    ]
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});


const Event = mongoose.model("Event",eventSchema);

export default Event;