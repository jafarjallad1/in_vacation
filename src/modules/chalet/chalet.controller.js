import chaletModel from "../../../DB/models/chalet.model.js";
import userModel from "../../../DB/models/user.model.js";
import ownerModel from "../../../DB/models/owner.model.js";
import reservationModel from "../../../DB/models/reservation.model.js";
import cloudinary from "../../Utils/cloudinary.js";

// Add a new chalet

export const addChalet = async (req, res) => {
  try {
    const { name, location, contact, description, capacity, services, owner } = req.body;

    // Check if the owner exists
    const ownerData = await ownerModel.findById(owner);
    if (!ownerData) {
      return res.status(404).json({ error: "Owner not found." });
    }

    // Handle image uploads
    const images = await Promise.all(
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

    // Create the chalet
    const newChalet = await chaletModel.create({
      name,
      location,
      contact,
      description,
      capacity,
      services,
      images,
      owner, // Link the chalet to its owner
    });

    // Update the owner's chalet array
    ownerData.chalets.push(newChalet._id);
    await ownerData.save();

    res.status(201).json({ message: "Chalet added successfully", chalet: newChalet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error adding chalet", details: error.stack });
  }
};



// Get details of a specific chalet
export const getChaletDetails = async (req, res) => {
  try {
    const chalet = await chaletModel.findById(req.params.id).populate("owner", "username email");
    if (!chalet) {
      return res.status(404).json({ error: "Chalet not found." });
    }
    res.status(200).json(chalet);
  } catch (error) {
    res.status(500).json({ error: "Error fetching chalet details", details: error.stack });
  }
};

// Reserve a chalet
export const reserveChalet = async (req, res) => {
  try {
    const { userId, guestCount, date, period, totalCost } = req.body;

    // Validate required fields
    if (!userId || !guestCount || !date || !period || !totalCost) {
      return res.status(400).json({ error: "All reservation fields are required." });
    }

    // Find the chalet
    const chalet = await chaletModel.findById(req.params.id);
    if (!chalet) {
      return res.status(404).json({ error: "Chalet not found." });
    }

    // Find the user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check for overlapping reservation
    const existingReservation = await reservationModel.findOne({
      chalet: req.params.id,
      date: new Date(date),
      period,
    });

    if (existingReservation) {
      return res.status(400).json({ error: "This chalet is already reserved for the selected date and period." });
    }

    // Create a new reservation
    const reservation = await reservationModel.create({
      user: userId,
      chalet: req.params.id,
      guestCount,
      date,
      period,
      totalCost,
    });

    // Add the reservation ID to the chalet and user
    user.reservations.push(reservation._id);
    chalet.reservations.push(reservation._id);

    await user.save();
    await chalet.save();

    res.status(201).json({ message: "Reservation created successfully", reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating reservation", details: error.stack });
  }
};

// List all chalets
export const listChalets = async (req, res) => {
  try {
    const { name, city, date, period } = req.query;

    // Build a filter object
    const filter = {};

    if (name) {
      filter.name = { $regex: name, $options: "i" }; // Case-insensitive search
    }

    if (city) {
      filter["location.city"] = city;
    }

    if (date || period) {
      filter.reservations = {
        $not: {
          $elemMatch: {
            ...(date && { date: new Date(date) }),
            ...(period && { period }),
          },
        },
      };
    }

    // Fetch chalets and populate reservations
    const chalets = await chaletModel
      .find(filter)
      .populate({
        path: "reservations", // Populate the reservations field
        select: "-__v -createdAt -updatedAt", // Exclude unnecessary fields
      });

    res.status(200).json(chalets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching chalets", details: error.stack });
  }
};



// Edit chalet information
export const editChalet = async (req, res) => {
  try {
    const chalet = await chaletModel.findById(req.params.id);
    if (!chalet) {
      return res.status(404).json({ error: "Chalet not found." });
    }

    // Handle new image uploads (if any)
    const newImages = req.files
      ? await Promise.all(
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
        )
      : [];

    // Add new images to the chalet
    chalet.images.push(...newImages);

    // Update other fields
    Object.assign(chalet, req.body);

    await chalet.save();

    res.status(200).json({ message: "Chalet updated successfully", chalet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating chalet", details: error.stack });
  }
};
