import  jwt  from "jsonwebtoken";
import userModel from "../../../DB/models/user.model.js";
import bcrypt from  "bcryptjs/dist/bcrypt.js";
import { sendEmail } from "../../Utils/SendEmail.js";


export const register = async (req,res)=>{
    try{

    
    
    const {username,password,email,age} = req.body;
    
    // Simple validation
    const user = await userModel.findOne({email});
    if(user){ 
        return res.status(400).json({error: "Email already exists"});
}
    
    const hashedPassword = await bcrypt.hashSync(password , parseInt(process.env.SALTROUND) );
    const html = `
    <div>
    <h1>Welcome to our website ${username}!</h1>
    <p>Your account has been created successfully. </p>
    </div>
    `;
   
    
    sendEmail(email, "Welcome to our website" , html);
    const newUser = await userModel.create({username,email,password : hashedPassword , age});
    


    return res.status(201).json({message:"success" , user: newUser});
    
    }catch(error){
        console.error(error);
        return res.status(500).json({error: "catch error" , error: err.stack});
    }
}

export const login = async (req,res)=>{
    try{
        const {email, password} = req.body;
        const user = await userModel.findOne({email});
        if(!user){
            return res.status(404).json({error: "User not found"});
        }
        
        const isMatch = await bcrypt.compareSync(password, user.password);
        if(!isMatch){
            return res.status(400).json({error: "Incorrect password"});
        }
        
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'});
        
        return res.json({message: "success", token});


}catch(error){
    
    return res.status(500).json({error: "catch error" , error: err.stack});
}
}
