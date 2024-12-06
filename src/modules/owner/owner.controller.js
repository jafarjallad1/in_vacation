import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import chaletModel from "../../../DB/models/chalet.model.js";
import reservationModel from "../../../DB/models/reservation.model.js";
import ownerModel from "../../../DB/models/owner.model.js";

export const registerOwner = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if email is already registered
    const existingOwner = await ownerModel.findOne({ email });
    if (existingOwner) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALTROUND));

    // Create new owner
    const newOwner = await ownerModel.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Owner registered successfully", owner: newOwner });
  } catch (error) {
    res.status(500).json({ error: "Error registering owner", details: error.stack });
  }
};


export const loginOwner = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find owner by email
      const owner = await ownerModel.findOne({ email });
      if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
      }
  
      // Check password
      const isMatch = await bcrypt.compare(password, owner.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid password" });
      }
  
      // Generate token
      const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
      res.json({ message: "Login successful", token });
    } catch (error) {
      res.status(500).json({ error: "Error logging in", details: error.stack });
    }
  };


  export const getOwnerReservations = async (req, res) => {
    try {
      const ownerId = req.owner._id;
  
      // Validate ownerId format
      if (!ownerId || !ownerId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: "Invalid owner ID format" });
      }
  
      // Find chalets owned by the owner and populate reservations
      const chalets = await chaletModel.find({ owner: ownerId }).populate({
        path: "reservations",
        populate: [
          { path: "user", select: "username email" }, // Populate user details
          { path: "chalet", select: "name location" }, // Populate chalet details
        ],
      });
  
      console.log("Fetched Chalets:", chalets); // Debugging log
  
      if (!chalets || chalets.length === 0) {
        return res.status(404).json({ error: "No chalets found for this owner" });
      }
  
      // Collect all reservations from the chalets
      const reservations = chalets.reduce((acc, chalet) => {
        acc.push(...chalet.reservations);
        return acc;
      }, []);
  
      console.log("Collected Reservations:", reservations); // Debugging log
  
      res.status(200).json({
        message: "Reservations fetched successfully",
        chalets,
        reservations,
      });
    } catch (error) {
      console.error("Error fetching reservations:", error.message);
      res.status(500).json({ error: "Error fetching reservations", details: error.stack });
    }
  };




 export const getOwnerReservationsAlternative = async (req, res) => {
  try {
    const ownerId = req.owner._id;

    // Ensure ownerId is a string
    const ownerIdStr = ownerId.toString();

    // Validate ownerId format
    if (!ownerIdStr.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid owner ID format" });
    }

    // Find reservations directly linked to chalets owned by this owner
    const reservations = await reservationModel
      .find()
      .populate({
        path: "chalet",
        match: { owner: ownerId }, // Only include chalets owned by this owner
        select: "name location owner", // Select specific fields to return
      })
      .populate("user", "username email idImage") // Populate user details
      .sort({ date: 1 });

    // Filter out reservations where the chalet is not matched (not owned by the owner)
    const filteredReservations = reservations.filter((reservation) => reservation.chalet);

    if (filteredReservations.length === 0) {
      return res.status(404).json({ error: "No reservations found for this owner" });
    }

    res.status(200).json({
      message: "Reservations fetched successfully",
      reservations: filteredReservations,
    });
  } catch (error) {
    console.error("Error fetching reservations:", error.message);
    res.status(500).json({ error: "Error fetching reservations", details: error.stack });
  }
};

    
  
  
  
  
  


export const updateReservationStatus = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { status } = req.body; // "accepted" or "rejected"

    const reservation = await reservationModel.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    console.log("Old Status:", reservation.status); // Log old status
    reservation.status = status;
    const updatedReservation = await reservation.save();
    console.log("Updated Reservation:", updatedReservation); // Log updated reservation

    res.status(200).json({ message: `Reservation ${status} successfully`, reservation: updatedReservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating reservation", details: error.stack });
  }
};



export const editChaletInfo = async (req, res) => {
  try {
    const { chaletId } = req.params;
    const ownerId = req.owner.id; // Extract owner ID from JWT

    // Find the chalet and verify ownership
    const chalet = await chaletModel.findOne({ _id: chaletId, owner: ownerId });
    if (!chalet) {
      return res.status(404).json({ error: "Chalet not found or you do not own this chalet" });
    }

    // Update dynamic fields
    for (const key in req.body) {
      if (key in chalet) {
        chalet[key] = req.body[key];
      }
    }

    // Handle updating images if provided
    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map((file) =>
          new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: "chalet_project/chalets" },
              (error, result) => {
                if (result) resolve({ secure_url: result.secure_url, public_id: result.public_id });
                else reject(error);
              }
            ).end(file.buffer);
          })
        )
      );

      chalet.images = [...chalet.images, ...uploadedImages]; // Append new images to existing ones
    }

    // Save updated chalet
    await chalet.save();

    res.status(200).json({ message: "Chalet information updated successfully", chalet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating chalet information", details: error.stack });
  }
};


export const getOwnerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Find owner details by ID
    const owner = await ownerModel.findById(id).select("username email chalets");
    if (!owner) {
      return res.status(404).json({ error: "Owner not found" });
    }

    // Fetch chalet details for the owner's chalets
    const chalets = await chaletModel.find({ _id: { $in: owner.chalets } }).select("name location pricing");

    // Construct response
    const response = {
      username: owner.username,
      email: owner.email,
      chalets: chalets.map((chalet) => ({
        id: chalet._id,
        name: chalet.name,
        location: chalet.location,
        pricing: chalet.pricing,
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching owner details", details: error.stack });
  }
};