import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  category: { type: String },
  name: { type: String, required: true },
  stock: { type: Number, default: 0 },
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

export default Product;
