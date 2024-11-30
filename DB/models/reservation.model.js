import mongoose, { Schema } from "mongoose";

const reservationSchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    chalet: { type: mongoose.Schema.Types.ObjectId, ref: "Chalet", required: true },
    guestCount: { type: Number, required: true },
    date: { type: Date, required: true },
    period: { type: String, enum: ["morning", "evening", "fullDay"], required: true },
    totalCost: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending", // Default status is "pending"
    },
  },
  {
    timestamps: true,
  }
);

const reservationModel = mongoose.model("Reservation", reservationSchema);

export default reservationModel;
