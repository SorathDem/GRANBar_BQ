// routes/OrderRoutes.js
import express from "express";
import Order from "../models/Order.js";
import Caja from "../models/caja.js";

const router = express.Router();

// ✅ Crear nueva orden
router.post("/", async (req, res) => {
  try {
    const { productos = [], mesa = "No especificada" } = req.body;

    let total = 0;
    const items = (productos || []).map(p => {
      const cantidad = Number(p.cantidad || 1);
      const precio = Number(p.precio || 0);
      total += cantidad * precio;
      return {
        productId: p._id || null,
        tipo: p.tipo || "",
        nombre: p.nombre || p.name || "",
        cantidad,
        precio,
        recomendaciones: p.recomendaciones || p.nota || ""
      };
    });

    const order = new Order({
      mesa,
      items,
      total,
      status: "pending_print",
    });

    await order.save();
    res.status(201).json({ mensaje: "Orden creada", orderId: order._id });
  } catch (err) {
    console.error("Error creando orden:", err);
    res.status(500).json({ error: "Error creando orden" });
  }
});

// ✅ Obtener órdenes por fecha
router.get("/por-fecha/:fecha", async (req, res) => {
  try {
    const fecha = req.params.fecha;
    const fechaInicio = new Date(`${fecha}T00:00:00.000Z`);
    const fechaFin = new Date(`${fecha}T23:59:59.999Z`);

    const ordenes = await Order.find({
      createdAt: { $gte: fechaInicio, $lte: fechaFin }
    }).sort({ createdAt: 1 });

    res.json(ordenes);
  } catch (err) {
    console.error("Error obteniendo órdenes:", err);
    res.status(500).json({ error: "Error obteniendo órdenes" });
  }
});

router.get("/por-fecha/:fecha", async (req, res) => {
  try {
      const fecha = new Date(req.body.fecha);
      const siguienteDia = new Date(fecha);
      siguienteDia.setDate(fecha.getDate() + 1);

      const ordenes = await Order.find({
        createdAt: { $gte: fecha, $lt: siguienteDia }
      });

    res.json(ordenes);
  } catch (error) {
    console.error("❌ Error buscando órdenes por fecha:", error);
    res.status(500).json({ error: "Error al buscar órdenes" });
  }
});

// 💰 Cerrar caja
router.post("/cerrar-caja", async (req, res) => {
  try {
    const { fecha } = req.body;
    if (!fecha) {
      return res.status(400).json({ error: "Falta la fecha" });
    }

    const inicio = new Date(fecha);
    const fin = new Date(fecha);
    fin.setDate(inicio.getDate() + 1);

    const ordenes = await Order.find({
      createdAt: { $gte: inicio, $lt: fin }
    });

    if (ordenes.length === 0) {
      return res.status(404).json({ error: "No hay órdenes para esa fecha" });
    }

    const totalDia = ordenes.reduce((sum, o) => sum + (o.total || 0), 0);

    // Guarda un registro de caja
    const caja = new Caja({
      fecha: inicio,
      totalDia,
      cantidadOrdenes: ordenes.length
    });
    await caja.save();

    res.json({ message: "Caja cerrada correctamente", caja });
  } catch (error) {
    console.error("💥 Error cerrando caja:", error);
    res.status(500).json({ error: "Error al cerrar la caja" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;

    // Busca y actualiza la orden
    const ordenActualizada = await Order.findByIdAndUpdate(id, datosActualizados, { new: true });

    if (!ordenActualizada) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    res.json({ message: "Orden actualizada correctamente", orden: ordenActualizada });
  } catch (error) {
    console.error("❌ Error actualizando orden:", error);
    res.status(500).json({ error: "Error al actualizar la orden" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const ordenEliminada = await Order.findByIdAndDelete(id);

    if (!ordenEliminada) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    res.json({ message: "Orden eliminada correctamente", orden: ordenEliminada });
  } catch (error) {
    console.error("❌ Error eliminando orden:", error);
    res.status(500).json({ error: "Error al eliminar la orden" });
  }
});

// 📧 Reporte diario (dummy temporal)
router.post("/reporte/diario", (req, res) => {
  console.log("📅 Reporte diario generado:", req.body);
  res.json({ message: "Reporte diario enviado (simulado)" });
});

// 📧 Reporte mensual (dummy temporal)
router.post("/reporte/mensual", (req, res) => {
  console.log("📆 Reporte mensual generado:", req.body);
  res.json({ message: "Reporte mensual enviado (simulado)" });
});

export default router;
  