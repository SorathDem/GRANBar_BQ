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

    const productos = orden.items
      .map((p) => `${p.nombre} (${p.cantidad})${p.recomendaciones ? " — 📝 " + p.recomendaciones : ""}`)
      .join("<br>");

    const fechaLocal = new Date(orden.createdAt).toLocaleDateString("es-CO", { timeZone: "America/Bogota" });

    // Crear botones (sin usar onclick en HTML)
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "✏️ Editar";
    btnEditar.style.marginRight = "6px";
    btnEditar.addEventListener("click", () => abrirModalEdicion(orden));

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "🗑️ Eliminar";
    btnEliminar.style.background = "red";
    btnEliminar.style.color = "white";
    btnEliminar.addEventListener("click", () => eliminarOrden(orden._id));

    const celdaAcciones = document.createElement("td");
    celdaAcciones.appendChild(btnEditar);
    celdaAcciones.appendChild(btnEliminar);

    // Rellenar la fila
    fila.innerHTML = `
      <td>${orden.mesa || "N/A"}</td>
      <td>${productos}</td>
      <td>$${orden.total.toLocaleString()}</td>
      <td>${fechaLocal}</td>
    `;

    fila.appendChild(celdaAcciones);
    tablaBody.appendChild(fila);

    total += orden.total;
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

let ordenEditando = null;

// ✏️ Función para abrir el modal
function abrirModalEdicion(orden) {
  ordenEditando = orden;
  editMesa.value = orden.mesa;
  editTotal.value = orden.total;
  editFecha.value = orden.fecha ? orden.fecha.split("T")[0] : "";
  modalEditar.style.display = "flex";
}

// ❌ Cerrar modal
cancelarEdicionBtn.addEventListener("click", () => {
  modalEditar.style.display = "none";
  ordenEditando = null;
});

// 💾 Guardar cambios
guardarCambiosBtn.addEventListener("click", async () => {
  if (!ordenEditando) return;

  const datosActualizados = {
    mesa: editMesa.value,
    total: Number(editTotal.value),
    fecha: editFecha.value
  };

  try {
    const res = await fetch(`${API_BASE}/${ordenEditando._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosActualizados)
    });

    if (!res.ok) throw new Error("Error al actualizar la orden");

    alert("✅ Orden actualizada correctamente");
    modalEditar.style.display = "none";
    buscarOrdenesPorFecha(fechaInput.value);
  } catch (err) {
    console.error("💥 Error actualizando orden:", err);
    alert("❌ No se pudo actualizar la orden.");
  }
});

// 🗑️ Eliminar orden
async function eliminarOrden(id) {
  if (!confirm("¿Seguro que deseas eliminar esta orden?")) return;

  try {
    const res = await fetch(`${API_BASE}/ordenes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar orden");

    alert("🗑️ Orden eliminada correctamente");
    buscarOrdenesPorFecha(fechaInput.value);
  } catch (err) {
    console.error("💥 Error eliminando orden:", err);
    alert("❌ No se pudo eliminar la orden.");
  }
}

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
