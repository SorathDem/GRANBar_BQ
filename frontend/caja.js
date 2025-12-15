import { API_AUTH_LOGIN, API_URL, API_BASE, API_REPORTES } from "./config.js";

const fechaInput = document.getElementById("fecha");
const buscarBtn = document.getElementById("buscar");
const cerrarCajaBtn = document.getElementById("cerrarCaja");
const tablaBody = document.querySelector("#tablaOrdenes tbody");
const totalDiaDiv = document.getElementById("totalDia");
const logoutBtn = document.getElementById("logoutBtn");

// === ELEMENTOS DEL MODAL (ESTABAN FALTANDO) ===
const modalEditar = document.getElementById("modalEditar");
const editMesa = document.getElementById("editMesa");
const editTotal = document.getElementById("editTotal");
const editFecha = document.getElementById("editFecha");
const guardarCambiosBtn = document.getElementById("guardarCambios");
const cancelarEdicionBtn = document.getElementById("cancelarEdicion");

let ordenEditando = null;

// === IMPRIMIR FACTURA (YA ESTÁ BIEN, PERO LA MANTENEMOS) ===
async function imprimirFactura(orderId) {
  if (!confirm("¿Imprimir factura para esta orden?")) return;

  try {
    const response = await fetch(`${API_BASE}/${orderId}/imprimir-factura`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Error del servidor");
    }

    const data = await response.json();
    console.log("Factura enviada:", data);

    alert("Factura enviada a impresión");
    
    // Recargar la tabla para ver el cambio de estado
    buscarOrdenesPorFecha(fechaInput.value);

  } catch (error) {
    console.error("Error enviando factura:", error);
    alert("Error: " + error.message);
  }
}

// === RENDERIZAR ÓRDENES CON BOTÓN DE IMPRIMIR FACTURA ===
function renderOrdenes(ordenes) {
  tablaBody.innerHTML = "";
  let total = 0;

  ordenes.forEach((orden) => {
    const fila = document.createElement("tr");

    const productos = orden.items
      .map((p) => `${p.nombre} (${p.cantidad})${p.recomendaciones ? " — " + p.recomendaciones : ""}`)
      .join("<br>");

    const fechaLocal = new Date(orden.createdAt).toLocaleDateString("es-CO", {
      timeZone: "America/Bogota",
    });

    // === BOTONES ===
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.style.marginRight = "6px";
    btnEditar.addEventListener("click", () => abrirModalEdicion(orden));

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.style.background = "red";
    btnEliminar.style.color = "white";
    btnEliminar.style.marginRight = "6px";
    btnEliminar.addEventListener("click", () => eliminarOrden(orden._id));

    // NUEVO BOTÓN DE FACTURA
    const btnImprimirFactura = document.createElement("button");
    btnImprimirFactura.textContent = "Imprimir Factura";
    btnImprimirFactura.style.background = "#27ae60";
    btnImprimirFactura.style.color = "white";
    btnImprimirFactura.style.padding = "6px 10px";
    btnImprimirFactura.style.fontSize = "12px";
    btnImprimirFactura.style.border = "none";
    btnImprimirFactura.style.borderRadius = "4px";
    btnImprimirFactura.style.cursor = "pointer";
    btnImprimirFactura.addEventListener("click", () => imprimirFactura(orden._id));

    const celdaAcciones = document.createElement("td");
    celdaAcciones.appendChild(btnEditar);
    celdaAcciones.appendChild(btnEliminar);
    celdaAcciones.appendChild(btnImprimirFactura);

    fila.innerHTML = `
      <td>${orden.mesa || "N/A"}</td>
      <td style="text-align:left;">${productos}</td>
      <td>$${Number(orden.total).toLocaleString()}</td>
      <td>${fechaLocal}</td>
    `;
    fila.appendChild(celdaAcciones);
    tablaBody.appendChild(fila);

    total += Number(orden.total);
  });

  totalDiaDiv.textContent = `Total del día: $${total.toLocaleString()}`;
}

// === TUS DEMÁS FUNCIONES (SIN CAMBIOS) ===
async function buscarOrdenesPorFecha(fechaSeleccionada) {
  if (!fechaSeleccionada) {
    alert("Por favor selecciona una fecha.");
    return;
  }
  try {
    const fechaColombia = new Date(`${fechaSeleccionada}T00:00:00-05:00`);
    const fechaISO = fechaColombia.toISOString().split("T")[0];
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
    console.error("Error al buscar órdenes:", error);
    alert("Error al buscar las órdenes del día.");
  }
}

buscarBtn.addEventListener("click", () => {
  buscarOrdenesPorFecha(fechaInput.value);
});

// Cerrar caja
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
    alert(`Caja cerrada.\nTotal del día: $${data.caja.totalDia.toLocaleString()}`);
  } catch (error) {
    console.error("Error cerrando caja:", error);
    alert("Error al cerrar la caja.");
  }
});


// Modal edición
function abrirModalEdicion(orden) {
  ordenEditando = orden;
  editMesa.value = orden.mesa || "";
  editTotal.value = orden.total || 0;
  editFecha.value = orden.fecha ? orden.fecha.split("T")[0] : "";
  modalEditar.style.display = "flex";
}

cancelarEdicionBtn.addEventListener("click", () => {
  modalEditar.style.display = "none";
  ordenEditando = null;
});

guardarCambiosBtn.addEventListener("click", async () => {
  if (!ordenEditando) return;
  const datos = {
    mesa: editMesa.value,
    total: Number(editTotal.value),
    fecha: editFecha.value
  };
  try {
    const res = await fetch(`${API_BASE}/${ordenEditando._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error("Error actualizando");
    alert("Orden actualizada");
    modalEditar.style.display = "none";
    buscarOrdenesPorFecha(fechaInput.value);
  } catch (err) {
    alert("Error al guardar cambios");
  }
});

async function eliminarOrden(id) {
  if (!confirm("¿Seguro que deseas eliminar esta orden?")) return;
  try {
    const res = await fetch(`${API_BASE}/ordenes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error eliminando");
    alert("Orden eliminada");
    buscarOrdenesPorFecha(fechaInput.value);
  } catch (err) {
    alert("Error al eliminar");
  }
}

// Cerrar sesión
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// Auto-cargar fecha desde URL
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const fechaURL = params.get("fecha");
  if (fechaURL) {
    fechaInput.value = fechaURL;
    buscarOrdenesPorFecha(fechaURL);
  }
});