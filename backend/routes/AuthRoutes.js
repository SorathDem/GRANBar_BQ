import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Caja from "../models/caja.js";
import Order from "../models/Order.js"; // ⚠️ Te faltaba importar Order
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

/* ===========================================
   🔧 MANEJO DE CORS (para Render)
   =========================================== */
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

/* ===========================================
   🔐 LOGIN DE USUARIO
   =========================================== */
router.post("/login", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Código requerido" });

    const user = await User.findOne({ code });
    if (!user) {
      return res.status(401).json({ message: "Código inválido" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "claveSecreta",
      { expiresIn: "12h" }
    );

    // ✅ Respuesta con encabezados CORS
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");

    return res.json({ token, role: user.role });
  } catch (error) {
    console.error("❌ Error en login:", error);
    return res.status(500).json({ message: "Error en el servidor" });
  }
});

/* ===========================================
   💰 CERRAR CAJA
   =========================================== */
router.post("/cerrar-caja", async (req, res) => {
  try {
    const { fecha } = req.body;
    if (!fecha) {
      return res.status(400).json({ error: "Fecha requerida" });
    }

    const fechaInicio = new Date(`${fecha}T00:00:00.000Z`);
    const fechaFin = new Date(`${fecha}T23:59:59.999Z`);

    const ordenes = await Order.find({
      createdAt: { $gte: fechaInicio, $lte: fechaFin },
    });

    if (ordenes.length === 0) {
      return res.status(404).json({ mensaje: "No hay órdenes para esa fecha" });
    }

    const totalDia = ordenes.reduce((acc, o) => acc + (o.total || 0), 0);

    const caja = new Caja({
      fecha: fechaInicio,
      totalDia,
      ordenes: ordenes.map((o) => ({
        orderId: o._id,
        mesa: o.mesa,
        total: o.total,
        createdAt: o.createdAt,
      })),
    });

    await caja.save();

    return res.json({
      mensaje: "✅ Caja cerrada y guardada exitosamente",
      caja,
    });
  } catch (err) {
    console.error("❌ Error cerrando caja:", err);
    return res.status(500).json({ error: "Error cerrando caja" });
  }
});

export default router;
