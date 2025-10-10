import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  mesa: String,
  fecha: String, // "2025-10-08"
  items: [
    {
      nombre: String,
      cantidad: Number,
      precio: Number,
    },
  ],
  total: Number,
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);


