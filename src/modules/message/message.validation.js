import Joi from "joi"
export const sendMessageSchema = {
body: Joi.object({
    message: Joi.string().required().min(1),
})
,
params: Joi.object({
    receiverId: Joi.string().required().length(24),
})
}