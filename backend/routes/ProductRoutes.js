import express from "express";
import Product from "../models/Product.js";

const router = express.Router();

// GET: listar todos los productos
router.get("/", async (req, res) => {
  try {
    const productos = await Product.find();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// GET: obtener un producto por id
router.get("/:id", async (req, res) => {
  try {
    const producto = await Product.findById(req.params.id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener producto" });
  }
});

// POST: crear producto
router.post("/", async (req, res) => {
  try {
    const nuevo = new Product(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(400).json({ error: "Error al crear producto" });
  }
});

// PUT: actualizar producto
router.put("/:id", async (req, res) => {
  try {
    const actualizado = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: "Error al actualizar producto" });
  }
});

// DELETE: eliminar producto
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Producto eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

export default router;
