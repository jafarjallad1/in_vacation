import { Router } from "express";
import * as authcontroller from "./auth.controller.js";
import validation from "../../middleware1/validation.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

const router = Router();

router.post('/register', validation(registerSchema), authcontroller.register);

router.post('/login', validation(loginSchema) , authcontroller.login);
export default router;
