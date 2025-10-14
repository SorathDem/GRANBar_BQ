import express from "express";
import Caja from "../models/caja.js";

const router = express.Router();

// GET: obtener todas las cajas
router.get("/", async (req, res) => {
  try {
    const cajas = await Caja.find().sort({ fecha: -1 });
    res.json(cajas);
  } catch (error) {
    console.error("Error al obtener cajas:", error);
    res.status(500).json({ error: "Error al obtener cajas" });
  }
});

export default router;
