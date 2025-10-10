import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";

const router = express.Router();

// 🔁 Redirige /api/reportes → /api/reportes/reporte-diario
router.post("/", (req, res, next) => {
  req.url = "/reporte-diario";
  next();
});

// 🧾 Ruta principal para generar reporte diario
router.post("/reporte-diario", async (req, res) => {
  try {
    const { ordenes } = req.body;

    if (!ordenes || ordenes.length === 0) {
      return res.status(400).json({ error: "No hay ordenes para generar el reporte" });
    }

    const fechaActual = new Date();
    const fechaStr = `${fechaActual.getDate()}-${fechaActual.getMonth() + 1}-${fechaActual.getFullYear()}`;
    const nombreArchivo = `reporte_diario_${fechaStr}.pdf`;

    const doc = new PDFDocument({ margin: 40 });
    const rutaArchivo = `./${nombreArchivo}`;
    const stream = fs.createWriteStream(rutaArchivo);
    doc.pipe(stream);

    // 🧾 ENCABEZADO
    doc.text("Reporte DIARIO de Ventas", { align: "center" });
    doc
      .moveDown(0.5)
      .font("Helvetica")
      .fontSize(11)
      .fillColor("#555555")
      .text(`Periodo: ${fechaStr}`, { align: "center" })
      .moveDown(1.5);

    // 🧱 CABECERA DE LA TABLA
    const encabezados = ["Fecha", "Mesa", "Productos", "Total"];
    const colX = [50, 150, 230, 470];
    const anchoCol = [90, 70, 220, 90];
    const startY = doc.y;

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#FFFFFF");
    doc.rect(45, startY - 2, 510, 20).fill("#4a90e2").stroke();

    encabezados.forEach((titulo, i) => {
      doc.text(titulo, colX[i], startY + 3, { width: anchoCol[i], align: "center" });
    });

    // 🧾 CUERPO DE LA TABLA
    doc.moveDown();
    let posY = startY + 25;
    let totalGeneral = 0;

    ordenes.forEach((orden, index) => {
      const { fecha, mesa, productos, total } = orden;
      const bgColor = index % 2 === 0 ? "#f9f9f9" : "#efefef";
      doc.rect(45, posY - 3, 510, 20).fill(bgColor).stroke();

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#000000")
        .text(fecha || "N/A", colX[0], posY, { width: anchoCol[0], align: "center" })
        .text(String(mesa || ""), colX[1], posY, { width: anchoCol[1], align: "center" })
        .text(productos || "", colX[2], posY, { width: anchoCol[2], align: "left" })
        .text(`$${(total || 0).toLocaleString()}`, colX[3], posY, { width: anchoCol[3], align: "right" });

      totalGeneral += total || 0;
      posY += 20;

      if (posY > 700) {
        doc.addPage();
        posY = 60;
      }
    });

    // 🧮 TOTAL GENERAL
    doc
      .moveDown(2)
      .fontSize(12)
      .fillColor("#2e7d32")
      .text(`Total general: $${totalGeneral.toLocaleString()}`, { align: "right" })
      .moveDown(0.3)
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#333333")
      .text(`Ordenes procesadas: ${ordenes.length}`, { align: "right" });

    // 🧍 PIE DE PAGINA
    doc
      .moveDown(2)
      .font("Helvetica-Oblique")
      .fontSize(8)
      .fillColor("#777777")
      .text("Generado automáticamente por el sistema de reportes del restaurante", {
        align: "right",
      });

    doc.end();

    stream.on("finish", () => {
      res.download(rutaArchivo, nombreArchivo, (err) => {
        if (err) console.error("Error al enviar el archivo:", err);
        fs.unlinkSync(rutaArchivo); // Eliminar después de enviar
      });
    });
  } catch (error) {
    console.error("Error generando reporte:", error);
    res.status(500).json({ error: "Error al generar el reporte" });
  }
});

export default router;
