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

router.get("/reporte/mensual", async (req, res) => {
  const { year, month } = req.query;

  const inicio = new Date(`${year}-${month}-01T00:00:00`);
  const fin = new Date(year, month, 0, 23, 59, 59);

  const ordenes = await Order.find({
    createdAt: { $gte: inicio, $lte: fin },
  });

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=reporte-${year}-${month}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(18).text(`Reporte mensual ${month}/${year}`);
  doc.moveDown();

  let totalGeneral = 0;

  ordenes.forEach(o => {
    const fecha = o.createdAt.toISOString().split("T")[0];
    doc.fontSize(12).text(
      `${fecha} - Mesa ${o.mesa} - $${o.total}`
    );
    totalGeneral += o.total;
  });

  doc.moveDown();
  doc.fontSize(14).text(`TOTAL MENSUAL: $${totalGeneral}`);

  doc.end();
});


router.get("/reporte/diario", async (req, res) => {
  const { fecha } = req.query;

  const inicio = new Date(`${fecha}T00:00:00`);
  const fin = new Date(`${fecha}T23:59:59`);

  const ordenes = await Order.find({
    createdAt: { $gte: inicio, $lte: fin },
  });

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=reporte-${fecha}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(18).text(`Reporte diario - ${fecha}`);
  doc.moveDown();

  let total = 0;

  ordenes.forEach((o, i) => {
    doc.fontSize(12).text(
      `${i + 1}. Mesa ${o.mesa} - $${o.total}`
    );
    total += o.total;
  });

  doc.moveDown();
  doc.fontSize(14).text(`TOTAL DEL DÍA: $${total}`);

  doc.end();
});

export default router;
