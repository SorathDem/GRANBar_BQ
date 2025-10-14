import { API_BASE } from "./config.js";

const tablaCierres = document.getElementById("tablaCierres");
const logoutBtn = document.getElementById("logoutBtn");

// 🔹 Cerrar sesión
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// 🔹 Cargar cierres de caja
async function cargarCierres() {
  try {
    console.log(`📡 Cargando cierres desde: ${API_BASE}/cierres`);

    const resp = await fetch(`${API_BASE}/cierres`, {
      headers: { "Content-Type": "application/json" },
    });

    // 🚨 Si el backend no responde con éxito
    if (!resp.ok) {
      const text = await resp.text();
      console.error("⚠️ Respuesta no OK del servidor:", text);
      throw new Error(`Error ${resp.status}: ${text}`);
    }

    // 🧠 Validar que realmente sea JSON
    const contentType = resp.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await resp.text();
      console.error("⚠️ El backend devolvió HTML en lugar de JSON:", text.slice(0, 200));
      throw new Error("El backend devolvió HTML en lugar de JSON (revisa la URL o el servidor).");
    }

    const cierres = await resp.json();

    if (!Array.isArray(cierres) || cierres.length === 0) {
      tablaCierres.innerHTML = `<tr><td colspan="4">No hay cierres de caja registrados</td></tr>`;
      return;
    }

    renderCierres(cierres);

  } catch (err) {
    console.error("💥 Error al cargar cierres:", err);
    tablaCierres.innerHTML = `<tr><td colspan="4">❌ Error al cargar los cierres de caja<br><small>${err.message}</small></td></tr>`;
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
      <td><button class="consultar-btn" data-fecha="${fecha}">Consultar</button></td>
    `;

    tablaCierres.appendChild(fila);
  });

  // 🔘 Agregar eventos a los botones
  document.querySelectorAll(".consultar-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const fecha = e.target.dataset.fecha;
      window.location.href = `caja.html?fecha=${fecha}`;
    });
  });
}

// 🔹 Inicializar
cargarCierres();
