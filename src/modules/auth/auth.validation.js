import Joi from "joi";
import { generalFields } from "../../middleware1/validation";



export const registerschema = {
    body: Joi.object({
        username: Joi.string().min(3).max(40).required().messages({
            "string.min": "Username must be at least 3 characters long",
            "string.max": "Username must not exceed 40 characters",
            "any.required": "Username is a required field",
        }),
        email: generalFields.email,
        password: generalFields.password,
        confirmPassword: Joi.valid(Joi.ref('password')).required(),
        
    
})
};

export const loginSchema = {
    body: Joi.object({
        email: generalFields.email,
        password: generalFields.password,
    })
};