import jwt from "jsonwebtoken";
import userModel from "../../../DB/models/user.model.js";
import chaletModel from "../../../DB/models/chalet.model.js";
import reservationModel from "../../../DB/models/reservation.model.js";
import bcrypt from 'bcryptjs';
import crypto from "crypto";
import { sendEmail } from "../../Utils/SendEmail.js";
import cloudinary from "../../Utils/cloudinary.js";

export const register = async (req, res) => {
    try {
        // Validate file existence
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { username, password, email, phone } = req.body;

        // Cloudinary upload using memory buffer
        const { secure_url, public_id } = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: "chalet_project/users" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file.buffer); // Use the buffer for memoryStorage
        });

        // Check if the user with the given email already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }

        // Hash the password asynchronously
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALTROUND));

        // Prepare HTML content for the welcome email
        const html = `
            <div>
                <h1>Welcome to IN VACATION, ${username}!</h1>
                <p>Your account has been created successfully.</p>
            </div>
        `;

        // Send welcome email
        await sendEmail(email, "Welcome to IN VACATION", html);

        // Create the new user
        const newUser = await userModel.create({
            username,
            email,
            password: hashedPassword,
            phone,
            idImage: {
                secure_url,
                public_id,
            },
        });

        // Respond with success and user data
        return res.status(201).json({ message: "success", user: newUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "catch error", details: error.stack });
    }
};


export const login = async (req, res) => {
  try {
      const { email, password } = req.body;
      const user = await userModel.findOne({ email });
      if (!user) {
          return res.status(404).json({ error: "User not found" });
      }

      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ error: "Incorrect password" });
      }

      // Include additional fields in the token payload
      const token = jwt.sign(
          { userId: user._id, email: user.email, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
      );

      return res.json({ message: "success", token });
  } catch (error) {
      return res.status(500).json({ error: "catch error", details: error.stack });
  }
};


export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a token
    const token = crypto.randomBytes(20).toString("hex");

    // Set the token and expiration time in the user's record
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${req.protocol}://${req.get("host")}/api/users/reset-password/${token}`;
    const html = `
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>If you did not request this, please ignore this email.</p>
    `;
    await sendEmail(user.email, "Password Reset", html);

    res.status(200).json({ message: "Password reset email sent." });
  } catch (error) {
    res.status(500).json({ error: "Error requesting password reset", details: error.stack });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Find the user with the token and check expiration
    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Token should not be expired
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Hash the new password
    const hashedPassword = bcrypt.hashSync(newPassword, parseInt(process.env.SALTROUND));

    // Update the user's password and clear the reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error resetting password", details: error.stack });
  }
};


export const getUserReservations = async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await userModel.findById(userId).populate({
        path: "reservations",
        populate: {
          path: "chalet", // Populate chalet details within each reservation if available
          select: "name", // Only show the chalet name
        },
      });
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.status(200).json({ reservations: user.reservations });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error fetching reservations", details: error.stack });
    }
  };


export const reserveChalet = async (req, res) => {
  try {
    const { userId } = req.body; // Assume userId is sent in the request body
    const { guestCount, date, period, totalCost } = req.body;

    // Find the chalet
    const chalet = await chaletModel.findById(req.params.id);
    if (!chalet) {
      return res.status(404).json({ error: "Chalet not found" });
    }

    // Find the user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
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

    // Add the reservation ID to the user and chalet
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

export const getUser = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from request parameters

    // Fetch the user details
    const user = await userModel.findById(userId).lean(); // Fetch the user document

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch the reservations related to the user
    const reservations = await reservationModel
      .find({ userId }) // Find reservations associated with this user
      .populate({
        path: "chaletId", // Assuming reservation schema references `chaletId`
        select: "name location pricing", // Include specific chalet fields
      })
      .lean();

    // Return the complete user details including populated reservations
    return res.status(200).json({
      message: "User retrieved successfully",
      user: {
        ...user,
        reservations, // Attach the user's reservations
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

