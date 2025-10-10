import mongoose from "mongoose";

const cajaSchema = new mongoose.Schema({
  fecha: { type: Date, required: true },
  totalDia: { type: Number, required: true },
  cantidadOrdenes: { type: Number, required: true }
});

export default mongoose.model("Caja", cajaSchema);
