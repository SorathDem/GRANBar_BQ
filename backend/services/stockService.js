import Product from "../models/Product.js";

export const descontarStockYDetectarBajo = async (items) => {
  const alertasStockBajo = [];

  for (const item of items) {
    if (!item.productId) continue;

    const producto = await Product.findById(item.productId);

    if (!producto) {
      throw new Error(`Producto no encontrado: ${item.nombre}`);
    }

    if (producto.stock < item.cantidad) {
      throw new Error(
        `Stock insuficiente para ${producto.name} (disponible: ${producto.stock})`
      );
    }

    producto.stock -= item.cantidad;
    await producto.save();

    // 🔔 Detectar stock bajo
    if (producto.stock <= 5) {
      alertasStockBajo.push({
        productoId: producto._id,
        nombre: producto.name,
        stockActual: producto.stock
      });
    }
  }

  return alertasStockBajo;
};
