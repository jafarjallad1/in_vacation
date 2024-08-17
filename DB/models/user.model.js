import mongoose,{ Schema } from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    age:{
       type: Number,
       
    },
   
    

} , {
    timestamps: true,
    
});
const userModel = mongoose.model('User', userSchema);

export default userModel;