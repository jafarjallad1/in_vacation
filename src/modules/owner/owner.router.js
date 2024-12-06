import { Router } from "express";
import {
  registerOwner,
  loginOwner,
  getOwnerReservations,
  updateReservationStatus,
  editChaletInfo,
  getOwnerDetails,
  getOwnerReservationsAlternative,
} from "./owner.controller.js";
import { ownerauth } from "../../middleware1/auth.js"; // Middleware to verify owner's token

const ownerRouter = Router();

// Register a new owner
ownerRouter.post("/register", registerOwner);

// Login owner
ownerRouter.post("/login", loginOwner);

// Get owner details
ownerRouter.get("/:id", getOwnerDetails);



// Get reservations for owner's chalets
ownerRouter.get("/reservations", ownerauth, getOwnerReservations);

// Alternative way to fetch owner reservations
ownerRouter.get("/reservations/alternative", ownerauth, getOwnerReservationsAlternative);

// Accept or reject a reservation
ownerRouter.patch("/reservations/:reservationId", ownerauth, updateReservationStatus);

// Edit chalet information
ownerRouter.patch("/chalets/:chaletId", ownerauth, editChaletInfo);

export default ownerRouter;
