import { Router } from "express";
import * as authcontroller from "./auth.controller.js"



const router = Router();

router.post('/register', authcontroller.register);

router.post('/login',  authcontroller.login);
export default router;
