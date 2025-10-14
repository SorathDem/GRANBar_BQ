const API_CAJAS = "https://granbar-bq.onrender.com/api/cajas";

const tbody = document.getElementById("tbodyCierres");
const mensaje = document.getElementById("mensaje");

async function cargarCierres() {
  try {
    const res = await fetch(API_CAJAS);
    if (!res.ok) throw new Error("Error al obtener cierres de caja");

    const data = await res.json();

    // Vaciar tabla antes de agregar filas nuevas
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      mensaje.textContent = "No hay cierres de caja registrados aún.";
      return;
    }

    mensaje.textContent = "";

    data.forEach(caja => {
      const fila = document.createElement("tr");

      // Validaciones seguras
      const fechaCaja = caja.fecha ? new Date(caja.fecha) : null;
      const totalDia = caja.totalDia || 0;
      const cantidadOrdenes = caja.cantidadOrdenes || 0;

      const fechaFormateada = fechaCaja
        ? fechaCaja.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "Sin fecha";

      fila.innerHTML = `
        <td>${fechaFormateada}</td>
        <td>$${totalDia.toLocaleString("es-CO")}</td>
        <td>${cantidadOrdenes}</td>
      `;

      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error("❌ Error:", error);
    mensaje.textContent = "Ocurrió un error al cargar los cierres.";
  }
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", cargarCierres);
