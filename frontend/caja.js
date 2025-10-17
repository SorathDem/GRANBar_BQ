import { API_AUTH_LOGIN, API_URL, API_BASE, API_REPORTES } from "./config.js";

const fechaInput = document.getElementById("fecha");
const buscarBtn = document.getElementById("buscar");
const cerrarCajaBtn = document.getElementById("cerrarCaja");
const reporteDiarioBtn = document.getElementById("reporteDiario");
const reporteMensualBtn = document.getElementById("reporteMensual");
const tablaBody = document.querySelector("#tablaOrdenes tbody");
const totalDiaDiv = document.getElementById("totalDia");
const logoutBtn = document.getElementById("logoutBtn");

// 🕓 Convertir fecha al horario de Colombia
function convertirFechaColombia(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-CO", { timeZone: "America/Bogota" });
}

// 🚪 Cerrar sesión
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// 🔍 Buscar órdenes por fecha
async function buscarOrdenesPorFecha(fechaSeleccionada) {
  if (!fechaSeleccionada) {
    alert("Por favor selecciona una fecha.");
    return;
  }

  try {
    const fechaColombia = new Date(`${fechaSeleccionada}T00:00:00-05:00`);
    const fechaISO = fechaColombia.toISOString().split("T")[0]; // YYYY-MM-DD

    const response = await fetch(`${API_BASE}/por-fecha/${fechaISO}`);
    if (!response.ok) throw new Error(await response.text());

    const ordenes = await response.json();

    if (!Array.isArray(ordenes) || ordenes.length === 0) {
      tablaBody.innerHTML = `<tr><td colspan="5">No se encontraron órdenes para esa fecha</td></tr>`;
      totalDiaDiv.textContent = "";
      return;
    }

    renderOrdenes(ordenes);
  } catch (error) {
    console.error("💥 Error al buscar órdenes:", error);
    alert("❌ Error al buscar las órdenes del día.");
  }
}

buscarBtn.addEventListener("click", () => {
  buscarOrdenesPorFecha(fechaInput.value);
});

function renderOrdenes(ordenes) {
  tablaBody.innerHTML = "";
  let total = 0;

  ordenes.forEach((orden) => {
    const fila = document.createElement("tr");

    const productos = orden.items.map((p) => {
      let texto = `${p.nombre} (${p.cantidad})`;
      if (p.recomendaciones && p.recomendaciones.trim() !== "") {
        texto += ` — 📝 ${p.recomendaciones}`;
      }
      return texto;
    }).join("<br>");

    const fechaLocal = convertirFechaColombia(orden.createdAt);

    fila.innerHTML = `
      <td>${orden.mesa || "N/A"}</td>
      <td>${productos}</td>
      <td>$${orden.total.toLocaleString()}</td>
      <td>${fechaLocal}</td>
      <td>
        <button onclick="editOrden('${orden._id}')">✏️</button>
        <button onclick="deleteOrden('${orden._id}')">🗑️</button>
      </td>
    `;

    total += orden.total;
    tablaBody.appendChild(fila);
  });

  totalDiaDiv.textContent = `Total del día: $${total.toLocaleString()}`;
}


// 💰 Cerrar caja
cerrarCajaBtn.addEventListener("click", async () => {
  const fechaSeleccionada = fechaInput.value;
  if (!fechaSeleccionada) return alert("Selecciona una fecha antes de cerrar la caja.");

  const confirmacion = confirm(`¿Seguro que deseas cerrar la caja del día ${fechaSeleccionada}?`);
  if (!confirmacion) return;

  try {
    const response = await fetch(`${API_BASE}/cerrar-caja`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha: fechaSeleccionada }),
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    console.log("✅ Caja cerrada con éxito:", data);

    alert(`✅ Caja cerrada.\nTotal del día: $${data.caja.totalDia.toLocaleString()}`);
  } catch (error) {
    console.error("💥 Error cerrando caja:", error);
    alert("❌ Error al cerrar la caja.");
  }
});

window.editOrden = async function(id) {
  try {
    const res = await fetch(`${API_BASE}/orden/${id}`);
    if (!res.ok) throw new Error("No se pudo obtener la orden");

    const orden = await res.json();

    ordenIdInput.value = orden._id;
    mesaInput.value = orden.mesa || "";
    totalInput.value = orden.total || 0;

    // Mostrar los productos y recomendaciones en texto
    productosInput.value = orden.items.map(
      (p) => `${p.nombre} (${p.cantidad}) - $${p.precio}`
    ).join("\n");

    recomendacionesInput.value = orden.items.map(
      (p) => p.recomendaciones || ""
    ).join("\n");

    modalOrden.classList.remove("hidden");
  } catch (error) {
    console.error("💥 Error al editar orden:", error);
    alert("No se pudo cargar la orden.");
  }
};

// 💾 Guardar cambios de orden
ordenForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = ordenIdInput.value;

  const updatedOrden = {
    mesa: mesaInput.value,
    total: parseInt(totalInput.value),
    recomendaciones: recomendacionesInput.value,
    productos: productosInput.value,
  };

  try {
    const res = await fetch(`${API_BASE}/orden/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedOrden),
    });

    if (!res.ok) throw new Error("No se pudo actualizar la orden");

    alert("✅ Orden actualizada correctamente.");
    modalOrden.classList.add("hidden");
    buscarOrdenesPorFecha(fechaInput.value);
  } catch (error) {
    console.error("💥 Error guardando cambios:", error);
    alert("❌ Error al guardar los cambios de la orden.");
  }
});

// ❌ Cerrar modal
closeModalOrden.addEventListener("click", () => {
  modalOrden.classList.add("hidden");
});

// 🗑️ Eliminar orden
window.deleteOrden = async function(id) {
  if (!confirm("¿Seguro que deseas eliminar esta orden?")) return;

  try {
    const res = await fetch(`${API_BASE}/orden/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("No se pudo eliminar la orden");

    alert("🗑️ Orden eliminada correctamente.");
    buscarOrdenesPorFecha(fechaInput.value);
  } catch (error) {
    console.error("💥 Error eliminando orden:", error);
    alert("❌ No se pudo eliminar la orden.");
  }
};

// 📅 Reporte diario
reporteDiarioBtn.addEventListener("click", async () => {
  const fechaInputValor = fechaInput.value;
  if (!fechaInputValor) return alert("Selecciona una fecha para generar el reporte diario.");

  const correoDestino = prompt("Introduce el correo donde enviar el reporte:", "santiagoacostaavila2905@gmail.com");
  if (!correoDestino) return;

  try {
    const ordenesResp = await fetch(`${API_BASE}/por-fecha/${fechaInputValor}`);
    const ordenes = await ordenesResp.json();

    if (!Array.isArray(ordenes) || ordenes.length === 0) {
      alert("❌ No hay órdenes para esa fecha.");
      return;
    }

    const response = await fetch(`${API_REPORTES}/reporte-diario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordenes, correo: correoDestino }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("⚠️ Error en reporte diario:", errorText);
      alert("❌ Error al generar el reporte diario.");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");

    alert(`📧 Reporte diario generado y enviado a ${correoDestino}`);
  } catch (error) {
    console.error("💥 Error reporte diario:", error);
    alert("❌ Error al enviar el reporte diario.");
  }
});

// 📆 Reporte mensual
reporteMensualBtn.addEventListener("click", async () => {
  const mes = prompt("Introduce el mes (YYYY-MM):");
  if (!mes) return;

  const correoDestino = prompt("Introduce el correo donde enviar el reporte:", "dueno@restaurante.com");
  if (!correoDestino) return;

  try {
    const response = await fetch(API_REPORTES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: mes,
        correo: correoDestino,
        tipo: "mensual",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert(`📧 Reporte mensual enviado correctamente a ${correoDestino}`);
    } else {
      console.error("⚠️ Error en reporte mensual:", data);
      alert(data.error || "❌ Error al generar o enviar el reporte mensual.");
    }
  } catch (error) {
    console.error("💥 Error reporte mensual:", error);
    alert("❌ Error al enviar el reporte mensual.");
  }
});

// 🔄 Auto-cargar fecha desde cierre_caja.html (si viene con ?fecha=YYYY-MM-DD)
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const fechaURL = params.get("fecha"); // Ejemplo: ?fecha=2025-10-14

  if (fechaURL) {
    fechaInput.value = fechaURL;
    // Buscar automáticamente las órdenes del día seleccionado
    buscarOrdenesPorFecha(fechaURL);
  }
});
