// routes/OrderRoutes.js
import express from "express";
import Order from "../models/Order.js";
import Caja from "../models/caja.js";
import {descontarStockYDetectarBajo} from "../services/stockService.js";

const router = express.Router();

// ✅ CREAR ORDEN - VERSIÓN CORREGIDA Y FINAL
router.post("/", async (req, res) => {
  try {
    const { mesa, items = [] } = req.body;  // ← AHORA LEE "items" COMO DEBE SER

    if (!mesa) {
      return res.status(400).json({ error: "Falta la mesa" });
    }

    if (items.length === 0) {
      return res.status(400).json({ error: "No hay productos en la orden" });
    }


    let total = 0;

    const itemsProcesados = items.map(p => {
      const cantidad = Number(p.cantidad) || 1;
      const precio = Number(p.precio) || 0;
      total += cantidad * precio;

      return {
        productId: p._id || null,
        tipo: p.tipo || "",
        nombre: p.nombre || "Producto sin nombre",
        cantidad,
        precio,
        recomendaciones: p.recomendaciones || ""
      };
    });

    const nuevaOrden = new Order({
      mesa,
      items: itemsProcesados,
      total,
      status: "pending_print",  // ← para que el worker la imprima inmediatamente
      fecha: fechaColombia
    });

    await nuevaOrden.save();

    const alertasStockBajo = await descontarStockYDetectarBajo(itemsProcesados);

    res.status(201).json({
      mensaje: "Orden creada con éxito",
      orden: nuevaOrden,
      alertasStockBajo
    });

  } catch (err) {
    console.error("Error creando orden:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

const fechaColombia = new Date().toLocaleDateString("en-CA", {
  timeZone: "America/Bogota"
});

function rangoFechaColombia(fechaYYYYMMDD) {
  const inicio = new Date(
    new Date(`${fechaYYYYMMDD}T00:00:00`)
      .toLocaleString("en-US", { timeZone: "America/Bogota" })
  );

  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 1);

  return { inicio, fin };
}
// IMPRIMIR FACTURA (cambiar estado a pending_ticket)
// RUTA PARA IMPRIMIR FACTURA (SOLO CAMBIA EL STATUS)
router.patch("/:id/imprimir-factura", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          status: "pending_ticket",
          printedAttemptAt: new Date()
        } 
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    console.log(`Factura solicitada → Orden ${order._id} | Mesa ${order.mesa} → pending_ticket`);
    
    res.json({ 
      mensaje: "Factura enviada a impresión", 
      orden: order 
    });

  } catch (err) {
    console.error("Error al marcar factura:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// ✅ Obtener órdenes por fecha
router.get("/por-fecha/:fecha", async (req, res) => {
  try {
    const fecha = req.params.fecha;
    const ordenes = await Order.find({ fecha }).sort({ createdAt: 1 });

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

    // ✅ BUSCAR POR STRING
    const ordenes = await Order.find({ fecha });

    if (ordenes.length === 0) {
      return res.status(404).json({ error: "No hay órdenes para esa fecha" });
    }

    const totalDia = ordenes.reduce((sum, o) => sum + (o.total || 0), 0);

    // 🔁 BORRAR CIERRE PREVIO SI EXISTE
    await Caja.findOneAndDelete({ fecha });

    const caja = new Caja({
      fecha,
      totalDia,
      cantidadOrdenes: ordenes.length,
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
    const ordenActualizada = await Order.findByIdAndUpdate(
  id,
  datosActualizados,
  { new: true, runValidators: true }
);

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
  