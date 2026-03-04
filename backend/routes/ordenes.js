import express from "express";
import Orden from "../models/orden.js";

const router = express.Router();


// 🔹 1️⃣ Crear orden (se guarda en tabla "ordenes")
router.post("/", async (req, res) => {
  try {
    const nuevaOrden = new Orden(req.body);
    const guardada = await nuevaOrden.save();

    res.status(201).json({
      message: "Orden guardada correctamente",
      orden: guardada,
    });

  } catch (error) {
    console.error("Error creando orden:", error);
    res.status(500).json({ error: "Error creando orden" });
  }
});


// 🔹 2️⃣ Obtener todas las órdenes
router.get("/", async (req, res) => {
  try {
    const ordenes = await Orden.find().sort({ createdAt: -1 });
    res.json(ordenes);

  } catch (error) {
    console.error("Error obteniendo órdenes:", error);
    res.status(500).json({ error: "Error obteniendo órdenes" });
  }
});


// 🔹 3️⃣ Obtener solo pendientes
router.get("/pendientes", async (req, res) => {
  try {
    const ordenes = await Orden.find({ estado: "pendiente" })
      .sort({ createdAt: 1 });

    res.json(ordenes);

  } catch (error) {
    console.error("Error obteniendo pendientes:", error);
    res.status(500).json({ error: "Error obteniendo pendientes" });
  }
});


// 🔹 4️⃣ Cambiar estado (opcional)
router.patch("/:id", async (req, res) => {
  try {
    const { estado } = req.body;

    const actualizada = await Orden.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );

    res.json(actualizada);

  } catch (error) {
    console.error("Error actualizando orden:", error);
    res.status(500).json({ error: "Error actualizando orden" });
  }
});


// 🔹 5️⃣ Eliminar orden (para Realizado o Cancelado)
router.delete("/:id", async (req, res) => {
  try {
    await Orden.findByIdAndDelete(req.params.id);

    res.json({ message: "Orden eliminada correctamente" });

  } catch (error) {
    console.error("Error eliminando orden:", error);
    res.status(500).json({ error: "Error eliminando orden" });
  }
});


export default router;