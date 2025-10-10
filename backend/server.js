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

// === Configuración básica ===
app.use(express.json());

// ✅ Configurar CORS correctamente
const allowedOrigins = [
  "https://granbar-bq.onrender.com", // frontend en Render
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS bloqueado para " + origin), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// === Rutas de la API ===
app.use("/api/auth", AuthRoutes);
app.use("/api/productos", ProductRoutes);
app.use("/api/ordenes", OrderRoutes);
app.use("/api/reportes", ReportRoutes);

// === Conexión a MongoDB ===
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Error de conexión:", err));

// === Servir el frontend ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

// === Puerto dinámico (Render) ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
