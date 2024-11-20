import mongoose, { Schema } from "mongoose";

const ownerSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    chalets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chalet", // Reference to the Chalet model
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ownerModel = mongoose.model("Owner", ownerSchema);

export default ownerModel;
