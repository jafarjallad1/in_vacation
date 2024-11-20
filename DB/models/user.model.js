import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: { type: String }, // Token for password reset
  resetPasswordExpires: { type: Date }, // Expiration time for the token
  phone: { type: String, required: true },
  idImage: {
    secure_url: { type: String },
    public_id: { type: String },
  },
  reservations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
    },
  ],
}, {
  timestamps: true,
});

const userModel = mongoose.model("User", userSchema);

export default userModel;
