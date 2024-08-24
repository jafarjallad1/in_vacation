import { Router } from "express";
import * as messagecontroller from "./message.controller.js";
import validation from "../../middleware1/validation.js";
import { sendMessageSchema } from "./message.validation.js";

const router = Router();

router.post('/:receiverId',validation(sendMessageSchema) , messagecontroller.sendMessage);
router.get('/', messagecontroller.getMessages);


export default router;
