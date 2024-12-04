import Joi from "joi";

const dataMethods = [ 'body', 'params', 'query'];

export const generalFields = {
    email : Joi.string().email().min(6).max(50).required(),
    password : Joi.string().min(8).required(),
}

const validation = (schema) => {
    const validationArray = [];
    return (req, res, next) => {
        console.log("Incoming Request:", req.body); // Log request body
        dataMethods.forEach((key) => {
            if (schema[key]) {
                const validationResult = schema[key].validate(req[key], { abortEarly: false });
                if (validationResult.error) {
                    validationArray.push(...validationResult.error.details);
                }
            }
        });
        if (validationArray.length > 0) {
            console.error("Validation Errors:", validationArray); // Log validation errors
            return res.status(400).json({
                error: "Validation failed",
                details: validationArray.map((error) => ({
                    message: error.message,
                    path: error.path.join("."),
                })),
            });
        } else {
            next();
        }
    };
};





export default validation;


