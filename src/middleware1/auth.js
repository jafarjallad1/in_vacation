import jwt from 'jsonwebtoken';
import ownerModel from "../../DB/models/owner.model.js";

export const auth = (req , res , next) =>{

    try {
        
        const token = req.headers ;
        const decoded = jwt.verify(token , process.env.JWT_SECRET)
        if(!decoded){
            return res.status(401).json({msg: 'Token is not valid'})
        }

        req.id = decoded.id ;
        next();
    } catch (error) {
        
        return res.status(401).json({message: 'catch erorr' , error: error.stack})
    }

}




export const ownerauth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const owner = await ownerModel.findById(decoded.id);
    if (!owner) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.owner = owner; // Attach owner details to the request
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};


