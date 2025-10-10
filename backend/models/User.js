// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // 👈 aquí debe ser "code"
  role: { type: String, enum: ["caja", "mesero"], required: true }
});

const User = mongoose.model("User", userSchema);

export default User;
