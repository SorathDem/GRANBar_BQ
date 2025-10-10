import { API_AUTH_LOGIN, API_URL, API_BASE, API_REPORTES, API_REPORTE_MENSUAL } from "./config.js";

const fechaInput = document.getElementById("fecha");
const buscarBtn = document.getElementById("buscar");
const cerrarCajaBtn = document.getElementById("cerrarCaja");
const reporteDiarioBtn = document.getElementById("reporteDiario");
const reporteMensualBtn = document.getElementById("reporteMensual");
const tablaBody = document.querySelector("#tablaOrdenes tbody");
const totalDiaDiv = document.getElementById("totalDia");
const logoutBtn = document.getElementById("logoutBtn");

// 🕓 Función para convertir fecha al horario de Colombia
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
buscarBtn.addEventListener("click", async () => {
  const fechaSeleccionada = fechaInput.value;
  if (!fechaSeleccionada) return alert("Por favor selecciona una fecha.");

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
});

// 🧾 Renderizar órdenes en la tabla
function renderOrdenes(ordenes) {
  tablaBody.innerHTML = "";
  let total = 0;

  ordenes.forEach((orden) => {
    const fila = document.createElement("tr");
    const productos = orden.items.map((p) => `${p.nombre} (${p.cantidad})`).join(", ");
    const fechaLocal = convertirFechaColombia(orden.createdAt);

    fila.innerHTML = `
      <td>${orden.mesa || "N/A"}</td>
      <td>${productos}</td>
      <td>$${orden.total.toLocaleString()}</td>
      <td>${fechaLocal}</td>
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

// 📅 Reporte diario
reporteDiarioBtn.addEventListener("click", async () => {
  const fechaInputValor = fechaInput.value;
  if (!fechaInputValor) return alert("Selecciona una fecha para generar el reporte diario.");

  const correoDestino = prompt("Introduce el correo donde enviar el reporte:", "santiagoacostaavila2905@gmail.com");
  if (!correoDestino) return;

  const fechaColombia = new Date(`${fechaInputValor}T00:00:00-05:00`);

  try {
    const response = await fetch(API_REPORTES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: fechaColombia.toISOString(),
        correo: correoDestino,
        tipo: "diario",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert(`📧 Reporte diario enviado correctamente a ${correoDestino}`);
    } else {
      console.error("⚠️ Error en reporte diario:", data);
      alert(data.error || "❌ Error al generar o enviar el reporte diario.");
    }
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
    const response = await fetch(API_REPORTE_MENSUAL, {
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
