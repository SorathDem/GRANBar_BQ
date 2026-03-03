import express from "express";
import orden from "../models/orden.js"

const router = express.Router();

// Crear orden
router.post("/", async (req, res) => {
  try {
    const nuevaOrden = new orden(req.body);
    const guardada = await nuevaOrden.save();
    res.status(201).json({ orden: guardada });
  } catch (error) {
    res.status(500).json({ error: "Error creando orden" });
  }
});

// Obtener pendientes
router.get("/pendientes", async (req, res) => {
  try {
    const ordenes = await orden.find({ estado: "pendiente" });
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo órdenes" });
  }
});

// Cambiar estado
router.patch("/:id", async (req, res) => {
  try {
    const { estado } = req.body;
    const actualizada = await orden.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );
    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando orden" });
  }
});

export default router;