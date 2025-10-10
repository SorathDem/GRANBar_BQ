// seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB Atlas");

    await User.deleteMany(); // Limpia usuarios viejos

    await User.insertMany([
      { code: "1992", role: "caja" },
      { code: "2010", role: "mesero" }
    ]);

    console.log("✅ Usuarios insertados correctamente");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
