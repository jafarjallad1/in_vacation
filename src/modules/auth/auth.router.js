import { Router } from "express";
import * as authcontroller from "./auth.controller.js";
import validation from "../../middleware1/validation.js";
import { loginSchema, registerSchema } from "./auth.validation.js";
import fileUpload, { fileType } from "../../Utils/multer.js";

const router = Router();

router.post('/register',fileUpload(fileType.image).single('image'),  validation(registerSchema), authcontroller.register);

router.post('/login', validation(loginSchema) , authcontroller.login);

router.get("/users/:userId/reservations", authcontroller.getUserReservations);
router.get("/profile/:userId", authcontroller.getUser);
router.post("/forgot-password", authcontroller.requestPasswordReset);
router.post("/reset-password/:token", authcontroller.resetPassword);

export default router;
