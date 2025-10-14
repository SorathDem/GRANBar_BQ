import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import AuthRoutes from "./routes/AuthRoutes.js";
import ProductRoutes from "./routes/ProductRoutes.js";
import OrderRoutes from "./routes/OrderRoutes.js";
import ReportRoutes from "./routes/ReportRoutes.js";
import CajaRoutes from "./routes/CajaRoutes.js";

dotenv.config();

const app = express();

// === CORS CONFIGURADO CORRECTAMENTE ===
const allowedOrigins = [
  "https://granbar-bq.onrender.com", // tu frontend en Render
  "http://localhost:5500",           // para desarrollo local (opcional)
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS no permitido para este origen"));
      }
    },
    credentials: true,
  })
);

// Middleware JSON
app.use(express.json());

// === Rutas de la API ===
app.use("/api/auth", AuthRoutes);
app.use("/api/productos", ProductRoutes);
app.use("/api/ordenes", OrderRoutes);
app.use("/api/reportes", ReportRoutes);
app.use("/api/cajas", CajaRoutes);

// === Conexión a MongoDB ===
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Error de conexión:", err));

// === Servir frontend (solo si ambos están juntos) ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// === Puerto dinámico (Render asigna uno) ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
