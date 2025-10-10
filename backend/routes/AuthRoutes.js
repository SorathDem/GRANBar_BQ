import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Caja from "../models/caja.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { code } = req.body;
  const user = await User.findOne({ code });

  if (!user) {
    return res.status(401).json({ message: "Código inválido" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,   // 👈 usamos la variable de entorno
    { expiresIn: "12h" }
  );

  res.json({ token, role: user.role });
});

router.post("/cerrar-caja", async (req, res) => {
  try {
    const { fecha } = req.body;
    if (!fecha) {
      return res.status(400).json({ error: "Fecha requerida" });
    }

    const fechaInicio = new Date(`${fecha}T00:00:00.000Z`);
    const fechaFin = new Date(`${fecha}T23:59:59.999Z`);

    const ordenes = await Order.find({
      createdAt: { $gte: fechaInicio, $lte: fechaFin }
    });

    if (ordenes.length === 0) {
      return res.status(404).json({ mensaje: "No hay órdenes para esa fecha" });
    }

    const totalDia = ordenes.reduce((acc, o) => acc + (o.total || 0), 0);

    const caja = new Caja({
      fecha: fechaInicio,
      totalDia,
      ordenes: ordenes.map(o => ({
        orderId: o._id,
        mesa: o.mesa,
        total: o.total,
        createdAt: o.createdAt
      }))
    });

    await caja.save();

    res.json({
      mensaje: "✅ Caja cerrada y guardada exitosamente",
      caja
    });
  } catch (err) {
    console.error("❌ Error cerrando caja:", err);
    res.status(500).json({ error: "Error cerrando caja" });
  }
});

export default router;
