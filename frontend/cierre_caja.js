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

    // Llenar tabla con datos
    data.forEach(caja => {
      const fila = document.createElement("tr");

      // 🔹 Formatear fecha correctamente
      const fecha = new Date(caja.fecha).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });

      // 🔹 Crear fila con botón
      fila.innerHTML = `
        <td>${fecha}</td>
        <td>$${Number(caja.totalDia || 0).toLocaleString("es-CO")}</td>
        <td>${caja.cantidadOrdenes || 0}</td>
        <td>
          <button onclick="verDetalle('${caja.fecha}')">Ver Detalle</button>
        </td>
      `;

      tbody.appendChild(fila);
    });

  } catch (error) {
    console.error("❌ Error:", error);
    mensaje.textContent = "Ocurrió un error al cargar los cierres.";
  }
}

// 🔹 Función para redirigir a caja.html con la fecha seleccionada
function verDetalle(fecha) {
  const fechaISO = new Date(fecha).toISOString().split("T")[0]; // yyyy-mm-dd
  window.location.href = `./caja.html?fecha=${fechaISO}`;
}

// Ejecutar al cargar la página
cargarCierres();
