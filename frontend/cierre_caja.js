import { API_BASE } from "./config.js";

// 🔹 Verificamos que los elementos existan antes de usarlos
const tablaCierres = document.getElementById("tablaCierres");
const logoutBtn = document.getElementById("logoutBtn");

// ✅ Si el botón de logout existe, agregamos evento
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });
}

// ✅ Solo ejecutamos la lógica de cierres si existe la tabla
if (tablaCierres) {
  cargarCierres();
}

// 🔹 Cargar cierres de caja
async function cargarCierres() {
  try {
    console.log(`📡 Cargando cierres desde: ${API_BASE}/cierres`);

    const resp = await fetch(`${API_BASE}/cierres`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.warn("⚠️ Respuesta inesperada del servidor:", text.slice(0, 200));
      mostrarError(`Error del servidor (${resp.status})`);
      return;
    }

    // Verificar si el contenido es JSON antes de parsear
    const contentType = resp.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await resp.text();
      console.error("⚠️ El servidor devolvió HTML en lugar de JSON:", text.slice(0, 200));
      mostrarError("El servidor no devolvió datos válidos (verifica la ruta /cierres)");
      return;
    }

    const cierres = await resp.json();

    if (!Array.isArray(cierres) || cierres.length === 0) {
      tablaCierres.innerHTML = `
        <tr><td colspan="4" style="text-align:center;">No hay cierres de caja registrados</td></tr>`;
      return;
    }

    renderCierres(cierres);

  } catch (err) {
    console.error("💥 Error al cargar cierres:", err);
    mostrarError("❌ No se pudieron cargar los cierres de caja.");
  }
}

// 🔹 Mostrar los cierres en tabla
function renderCierres(cierres) {
  tablaCierres.innerHTML = "";
  cierres.forEach((caja) => {
    const fila = document.createElement("tr");
    const fecha = new Date(caja.fecha).toLocaleDateString("es-CO", {
      timeZone: "America/Bogota",
    });

    fila.innerHTML = `
      <td>${fecha}</td>
      <td>$${Number(caja.totalDia).toLocaleString()}</td>
      <td>${caja.cantidadOrdenes}</td>
      <td>
        <button class="consultar-btn" data-fecha="${caja.fecha}">
          Consultar
        </button>
      </td>
    `;

    tablaCierres.appendChild(fila);
  });

  // 🎯 Agregar eventos a los botones de consulta
  tablaCierres.querySelectorAll(".consultar-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const fecha = e.target.dataset.fecha;
      if (!fecha) return alert("⚠️ Fecha no válida.");
      window.location.href = `caja.html?fecha=${fecha}`;
    });
  });
}

// 🔹 Mostrar mensaje de error sin afectar otros apartados
function mostrarError(mensaje) {
  if (!tablaCierres) return;
  tablaCierres.innerHTML = `
    <tr><td colspan="4" style="color:#e74c3c; text-align:center;">${mensaje}</td></tr>`;
}
