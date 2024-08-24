
import mongoose,{ Schema , Types , model } from "mongoose";

 export const messageSchema = new Schema({
    message: {
        type: String,
        required: true,
    },
   receiverId: { 
    type: Types.ObjectId,
        ref: 'User',
        required: true,
    },
    
   }
   
    

 , {
    timestamps: true,
    
});
const messageModel = mongoose.model('Message', messageSchema);

export default messageModel;