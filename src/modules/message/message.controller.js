import messageModel from "../../../DB/models/message.model.js";
import userModel from "../../../DB/models/user.model.js";
import jwt from "jsonwebtoken"

export const sendMessage = async(req, res) =>{
  try {
    const { message } = req.body;
    const {receiverId} = req.params;

    const user = await userModel.findById(receiverId);
    if(!user) return res.status(404).json({ error: 'User not found' });
    await messageModel.create({  receiverId, message });
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    
    return res.status(404).json({ message: 'Error creating message'  , error: error.stack })
  }
     
}

export const getMessages = async(req, res) => {
try {
  const { token } = req.headers;
  const decoded = jwt.verify(token , process.env.JWT_SECRET );

  if(!decoded){
    return res.status(401).json({ error: 'Invalid token' });
  }

  const messages = await messageModel.find({ receiverId: decoded.id });
  return res.json({messages : messages});
} catch (error) {
  
  return res.status(404).json({ message: 'Error fetching messages'  , error: error.stack })
}

}