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

dotenv.config();
const app = express();

// === Configurar CORS (soluciona el error en Render) ===
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://granbar-bq.onrender.com", // ✅ dominio del frontend en Render
    "http://localhost:5500"             // opcional, para pruebas locales
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// === Middleware general ===
app.use(cors());
app.use(express.json());

// === Rutas API ===
app.use("/api/auth", AuthRoutes);
app.use("/api/productos", ProductRoutes);
app.use("/api/ordenes", OrderRoutes);
app.use("/api/reportes", ReportRoutes);

// === Conexión a MongoDB ===
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Error de conexión:", err));

// === Servir el frontend (HTML, CSS, JS) ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend")));

// ✅ Si no se encuentra la ruta, devolver el login.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// === Puerto dinámico (Render asigna uno automáticamente) ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
