import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import AuthRoutes from "./routes/AuthRoutes.js";
import ProductRoutes from "./routes/ProductRoutes.js";
import OrderRoutes from "./routes/OrderRoutes.js";
import ReportRoutes from "./routes/ReportRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", AuthRoutes);
app.use("/api/productos", ProductRoutes);
app.use("/api/ordenes", OrderRoutes);
app.use("/api/reportes", ReportRoutes);

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Error de conexión:", err));

// Puerto dinámico (Render asigna uno automáticamente)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
