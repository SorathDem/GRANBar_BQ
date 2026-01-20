// models/Order.js
import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  tipo: { type: String },
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true, default: 1 },
  precio: { type: Number, required: true, default: 0 },
  recomendaciones: { type: String, default: "" }
});

const OrderSchema = new mongoose.Schema({
  mesa: { type: String, default: "No especificada" },
  items: [ItemSchema],
  total: { type: Number, default: 0 },
  metodoPago: {
  type: String,
  enum: ["efectivo", "tarjeta", "transferencia", "nequi", "daviplata"],
  default: "efectivo"
},
  status: {
    type: String,
    enum: ["pending_print", "printing", "printed", "completed", "error"],
    default: "pending_print"
  },
  fecha: {
    type: String,
    default: () => {
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, "0");
      const day = String(hoy.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`; // ✅ formato YYYY-MM-DD local
    },
  },
  createdAt: { type: Date, default: Date.now },
  printedAt: { type: Date },
});

export default mongoose.models.Order ||
  mongoose.model("Order", OrderSchema, "orders");
