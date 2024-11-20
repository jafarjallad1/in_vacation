import { Router } from "express";
import multer from "multer";
import {
  addChalet,
  getChaletDetails,
  reserveChalet,
  listChalets,
  editChalet,
} from "./chalet.controller.js";

const chaletRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Add a new chalet with images
chaletRouter.post("/", upload.array("images", 5), addChalet);

// Get chalet details
chaletRouter.get("/:id", getChaletDetails);

// Reserve a chalet
chaletRouter.post("/:id/reserve", reserveChalet);

// List all chalets
chaletRouter.get("/", listChalets);

// Edit chalet information and images
chaletRouter.patch("/:id", upload.array("images", 5), editChalet);

export default chaletRouter;
