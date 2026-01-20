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

/* ===============================
   REPORTE DIARIO
================================ */
router.get("/reporte/diario", async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: "Fecha requerida" });
    }

    // 👉 FECHA EN FORMATO YYYY-MM-DD
    const inicio = new Date(`${fecha}T00:00:00-05:00`);
    const fin = new Date(`${fecha}T23:59:59-05:00`);

    const ordenes = await Order.find({
      createdAt: { $gte: inicio, $lte: fin }
    });

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte-diario-${fecha}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text(`Reporte diario - ${fecha}`, { align: "center" });
    doc.moveDown();

    let total = 0;

    ordenes.forEach((o, i) => {
      doc.fontSize(12).text(
        `${i + 1}. Mesa ${o.mesa} - $${o.total.toLocaleString("es-CO")}`
      );
      total += o.total;
    });

    doc.moveDown();
    doc.fontSize(14).text(`TOTAL DEL DÍA: $${total.toLocaleString("es-CO")}`);

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

    const inicio = new Date(`${year}-${month}-01T00:00:00-05:00`);
    const fin = new Date(year, Number(month), 0, 23, 59, 59);

    const ordenes = await Order.find({
      createdAt: { $gte: inicio, $lte: fin }
    });

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte-mensual-${year}-${month}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text(
      `Reporte mensual ${month}/${year}`,
      { align: "center" }
    );
    doc.moveDown();

    let totalGeneral = 0;

    ordenes.forEach(o => {
      const fecha = o.createdAt.toISOString().split("T")[0];
      doc.fontSize(12).text(
        `${fecha} - Mesa ${o.mesa} - $${o.total.toLocaleString("es-CO")}`
      );
      totalGeneral += o.total;
    });

    doc.moveDown();
    doc.fontSize(14).text(
      `TOTAL MENSUAL: $${totalGeneral.toLocaleString("es-CO")}`
    );

    doc.end();

  } catch (error) {
    console.error("❌ Error reporte mensual:", error);
    res.status(500).json({ error: "Error generando reporte mensual" });
  } 
});

export default router;
