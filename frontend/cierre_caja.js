// ✅ URL de la API en Render
const API_CAJAS = "https://granbar-bq.onrender.com/api/cajas";

const tbody = document.getElementById("tbodyCierres");
const mensaje = document.getElementById("mensaje");

async function cargarCierres() {
  try {
    const res = await fetch(API_CAJAS);
    if (!res.ok) throw new Error("Error al obtener cierres de caja");

    const data = await res.json();

    // Si no hay registros
    if (data.length === 0) {
      mensaje.textContent = "No hay cierres de caja registrados aún.";
      return;
    }

    mensaje.textContent = "";

    // Llenar tabla
    data.forEach(caja => {
      const fila = document.createElement("tr");

      // Formatear fecha
      const fecha = new Date(caja.fecha).toLocaleDateString("es-CO", {
        day: "2-digit", month: "2-digit", year: "numeric"
      });

      fila.innerHTML = `
        <td>${fecha}</td>
        <td>$${caja.totalDia.toLocaleString("es-CO")}</td>
        <td>${caja.cantidadOrdenes}</td>
      `;

      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error("❌ Error:", error);
    mensaje.textContent = "Ocurrió un error al cargar los cierres.";
  }
}

// Ejecutar al cargar la página
cargarCierres();
