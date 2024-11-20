import joi from "joi";
import { generalFields } from "../../middleware1/validation.js";
export const registerSchema = {
    body: joi.object({
        username: joi.string().min(3).max(40).required().messages({
            "string.min": "Username must be at least 3 characters long",
            "string.max": "Username must not exceed 40 characters",
            "any.required": "Username is a required field",
        }),
        email: generalFields.email,
        password: generalFields.password,
        confirmPassword: joi.valid(joi.ref('password')).required(),
        phone:joi.string().required().messages({
            "string.required": "Phone number is a required field",
        }),
       
})
};

export const loginSchema = {
    body: joi.object({
        email: generalFields.email,
        password: generalFields.password,
    })
};