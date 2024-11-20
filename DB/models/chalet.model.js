import mongoose, { Schema } from "mongoose";

const chaletSchema = new Schema(
  {
    name: { type: String, required: true },
    location: {
      city: { type: String, required: true },
      area: { type: String, required: true },
    },
    contact: { phone: { type: String, required: true } },
    description: { type: String },
    images: [
      {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
   
    capacity: {
      guests: { type: Number, required: true },
      rooms: { type: Number, required: true },
    },
    services: [{ type: String, required: true }],
    reservations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reservation",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner", // Reference to the Owner model
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const chaletModel = mongoose.model("Chalet", chaletSchema);

export default chaletModel;
