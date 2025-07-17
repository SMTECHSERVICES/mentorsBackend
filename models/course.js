import mongoose from "mongoose";


const courseSchema = new mongoose.Schema({
    title:{
        type:String,
        require:true,
         trim: true
    },
    thumbnail:{
        type:String,
        require:true
    },
    tumbnailPublicId:{
        type:String,
        select:false
    },
    description:{
        type:String,
        require:true
    },
    ExplorePoints:{
        type:String,
        require:true
    },
    availableMentors:[
       { type:mongoose.Schema.Types.ObjectId,
        ref:'Mentor'}
    ]
});

const Course = mongoose.model("Course",courseSchema);

export default Course;