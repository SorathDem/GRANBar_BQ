const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  _id: String,
  tipo: String,
  nombre: String,
  cantidad: Number,
  precio: Number,
  recomendaciones: String
});

const ordenSchema = new mongoose.Schema({
  mesa: {
    type: Number,
    required: true
  },
  estado: {
    type: String,
    enum: ["pendiente", "listo", "cancelado"],
    default: "pendiente"
  },
  items: [itemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Orden", ordenSchema, "ordenes");