const express = require("express");
const router = express.Router();
const Orden = require("../models/orden");


// 🔹 Crear orden
router.post("/", async (req, res) => {
  try {
    const nuevaOrden = new Orden(req.body);
    const guardada = await nuevaOrden.save();
    res.status(201).json({ orden: guardada });
  } catch (error) {
    res.status(500).json({ error: "Error creando orden" });
  }
});


// 🔹 Obtener solo pendientes (para meseroAcep)
router.get("/pendientes", async (req, res) => {
  try {
    const ordenes = await Orden.find({ estado: "pendiente" })
      .sort({ createdAt: 1 });

    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo órdenes" });
  }
});


// 🔹 Cambiar estado (plato listo o cancelar)
router.patch("/:id", async (req, res) => {
  try {
    const { estado } = req.body;

    const ordenActualizada = await Orden.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );

    res.json(ordenActualizada);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando orden" });
  }
});

module.exports = router;