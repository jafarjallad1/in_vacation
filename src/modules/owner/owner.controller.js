import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import chaletModel from "../../../DB/models/chalet.model.js";
import reservationModel from "../../../DB/models/reservation.model.js";
import ownerModel from "../../../DB/models/owner.model.js";
import userModel from "../../../DB/models/user.model.js";
import { sendEmail } from "../../Utils/SendEmail.js";
import cloudinary from "../../Utils/cloudinary.js";



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

    const reservation = await reservationModel
      .findById(reservationId)
      .populate("user", "username email"); // Populate user details for email

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    if (status === "rejected") {
      // Remove the reservation if status is "rejected"
      await reservation.deleteOne();
    } else {
      reservation.status = status; // Update status if "accepted"
      await reservation.save();
    }

    // Send email notification to the user
    const user = reservation.user;
    if (user && user.email) {
      const subject = `Reservation ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      const html = `
        <h3>Hello ${user.username},</h3>
        <p>Your reservation for ${reservation.date.toDateString()} during the ${reservation.period} has been <b>${status}</b>.</p>
        ${status === "accepted" ? `<p>You can proceed to enjoy your booking!</p>` : `<p>We apologize for the inconvenience.</p>`}
        <br>
        <p>Thank you,</p>
        <p>IN VACATION Team</p>
      `;

      await sendEmail(user.email, subject, html);
    }

    res.status(200).json({
      message: `Reservation ${status} successfully`,
      reservationId: reservation._id,
    });
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



export const editChaletInfoAndImages = async (req, res) => {
  try {
    const { chaletId } = req.params; // Extract chaletId from URL
    const ownerId = req.owner.id; // Extract owner ID from JWT

    // Use _id from body or params for clarity
    const id = req.body.id || chaletId;

    // Validate chaletId or id
    if (!id) {
      return res.status(400).json({ error: "Chalet ID is required." });
    }

    // Find the chalet and verify ownership
    const chalet = await chaletModel.findOne({ _id: id, owner: ownerId });
    if (!chalet) {
      return res
        .status(404)
        .json({ error: "Chalet not found or you do not own this chalet" });
    }

    // Prepare update object
    const updateData = {};
    for (const key in req.body) {
      if (key !== "id" && key !== "images") {
        const keys = key.split(".");
        if (keys.length === 1) {
          updateData[key] = req.body[key]; // Top-level fields
        } else {
          updateData[keys.join(".")] = req.body[key]; // Nested fields
        }
      }
    }

    // Handle image updates (Delete old images and upload new ones)
    if (req.files && req.files.length > 0) {
      // Delete old images
      if (chalet.images && chalet.images.length > 0) {
        const deletePromises = chalet.images.map((img) =>
          cloudinary.uploader.destroy(img.public_id)
        );
        await Promise.all(deletePromises);
      }

      // Upload new images
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

      updateData.images = uploadedImages; // Add new images to updateData
    }

    // Update the chalet using $set
    const updatedChalet = await chaletModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Chalet updated successfully",
      chalet: updatedChalet,
    });
  } catch (error) {
    console.error("Error updating chalet:", error);
    res.status(500).json({ error: "Error updating chalet", details: error.message });
  }
};


export const deleteChalet = async (req, res) => {
  try {
    const { chaletId } = req.params; // Extract chaletId from URL
    const ownerId = req.owner.id;    // Extract owner ID from JWT (authentication)

    // Find the chalet and verify ownership
    const chalet = await chaletModel.findOne({ _id: chaletId, owner: ownerId });
    if (!chalet) {
      return res.status(404).json({ error: "Chalet not found or unauthorized to delete" });
    }

    // Delete chalet images from Cloudinary if they exist
    if (chalet.images && chalet.images.length > 0) {
      const deletePromises = chalet.images.map((img) =>
        cloudinary.uploader.destroy(img.public_id)
      );
      await Promise.all(deletePromises);
    }

    // Delete the chalet from the database
    await chaletModel.deleteOne({ _id: chaletId });

    res.status(200).json({ message: "Chalet deleted successfully" });
  } catch (error) {
    console.error("Error deleting chalet:", error);
    res.status(500).json({ error: "Failed to delete chalet", details: error.message });
  }
};





