import express from "express";
import Caja from "../models/caja.js";
import PDFDocument from "pdfkit";
import Order from "../models/Order.js";

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

function encabezadoTabla(doc, y) {
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Mesa", 40, y)
    .text("Método de pago", 120, y)
    .text("Total", 350, y, { align: "right" });

  doc
    .moveTo(40, y + 15)
    .lineTo(550, y + 15)
    .stroke();

  doc.font("Helvetica");
}

function filaTabla(doc, y, mesa, metodo, total) {
  doc
    .fontSize(10)
    .text(mesa, 40, y)
    .text(metodo, 120, y)
    .text(`$${total.toLocaleString("es-CO")}`, 350, y, { align: "right" });
}

/* ===============================
   REPORTE DIARIO
================================ */
router.get("/reporte/diario", async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ error: "Fecha requerida (YYYY-MM-DD)" });
    }

    const ordenes = await Order.find({ fecha }).sort({ createdAt: 1 });

    if (ordenes.length === 0) {
      return res.status(404).json({ error: "No hay órdenes para esa fecha" });
    }

    const totalesPago = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      nequi: 0,
      daviplata: 0
    };

    let totalDia = 0;

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte-diario-${fecha}.pdf`
    );
    doc.pipe(res);

    doc.fontSize(18).text(`Reporte Diario`, { align: "center" });
    doc.fontSize(12).text(`Fecha: ${fecha}`, { align: "center" });
    doc.moveDown(2);

    let y = doc.y;
    encabezadoTabla(doc, y);
    y += 25;

    ordenes.forEach(o => {
      filaTabla(doc, y, `Mesa ${o.mesa}`, o.metodoPago, o.total);
      y += 18;

      totalDia += o.total;
      if (totalesPago[o.metodoPago] !== undefined) {
        totalesPago[o.metodoPago] += o.total;
      }

      if (y > 720) {
        doc.addPage();
        y = 50;
        encabezadoTabla(doc, y);
        y += 25;
      }
    });

    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text(`TOTAL DEL DÍA: $${totalDia.toLocaleString("es-CO")}`, { align: "right" });

    doc.moveDown();
    doc.fontSize(11).text("Totales por método de pago:");
    Object.entries(totalesPago).forEach(([metodo, total]) => {
      doc.text(`- ${metodo.toUpperCase()}: $${total.toLocaleString("es-CO")}`);
    });

    doc.end();
  } catch (error) {
    console.error("❌ Error reporte diario:", error);
    res.status(500).json({ error: "Error generando reporte diario" });
  }
});

/* ===============================
   REPORTE MENSUAL
================================ */
router.get("/reporte/mensual", async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: "Año y mes requeridos" });
    }

    const regex = new RegExp(`^${year}-${month}`);
    const ordenes = await Order.find({ fecha: { $regex: regex } }).sort({ fecha: 1 });

    if (ordenes.length === 0) {
      return res.status(404).json({ error: "No hay órdenes para ese mes" });
    }

    const totalesPago = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
      nequi: 0,
      daviplata: 0
    };

    let totalMes = 0;

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte-mensual-${year}-${month}.pdf`
    );
    doc.pipe(res);

    doc.fontSize(18).text(`Reporte Mensual ${month}/${year}`, { align: "center" });
    doc.moveDown(2);

    let fechaActual = "";
    let y = doc.y;

    ordenes.forEach(o => {
      if (o.fecha !== fechaActual) {
        fechaActual = o.fecha;
        doc.moveDown();
        doc.fontSize(13).text(`Fecha: ${fechaActual}`);
        y = doc.y + 10;
        encabezadoTabla(doc, y);
        y += 25;
        doc.font("Helvetica");
      }

      filaTabla(doc, y, `Mesa ${o.mesa}`, o.metodoPago, o.total);
      y += 18;

      totalMes += o.total;
      if (totalesPago[o.metodoPago] !== undefined) {
        totalesPago[o.metodoPago] += o.total;
      }

      if (y > 720) {
        doc.addPage();
        y = 50;
      }
    });

    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text(`TOTAL DEL MES: $${totalMes.toLocaleString("es-CO")}`, { align: "right" });

    doc.moveDown();
    doc.fontSize(11).text("Totales por método de pago:");
    Object.entries(totalesPago).forEach(([metodo, total]) => {
      doc.text(`- ${metodo.toUpperCase()}: $${total.toLocaleString("es-CO")}`);
    });

    doc.end();
  } catch (error) {
    console.error("❌ Error reporte mensual:", error);
    res.status(500).json({ error: "Error generando reporte mensual" });
  }
});

export default router;
