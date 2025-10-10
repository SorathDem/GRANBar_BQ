import { API_AUTH_LOGIN, API_URL, API_BASE, API_REPORTES, API_URL } from "./config.js";

const fechaInput = document.getElementById("fecha");
const buscarBtn = document.getElementById("buscar");
const cerrarCajaBtn = document.getElementById("cerrarCaja");
const reporteDiarioBtn = document.getElementById("reporteDiario");
const reporteMensualBtn = document.getElementById("reporteMensual");
const tablaBody = document.querySelector("#tablaOrdenes tbody");
const totalDiaDiv = document.getElementById("totalDia");

// 🕓 Función para convertir fecha al horario de Colombia
function convertirFechaColombia(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
  });
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// 🔍 Buscar órdenes por fecha (ajustando a hora de Colombia)
buscarBtn.addEventListener("click", async () => {
  const fechaSeleccionada = fechaInput.value;
  if (!fechaSeleccionada) {
    alert("Por favor selecciona una fecha.");
    return;
  }

  try {
    // ✅ Ajustar la fecha seleccionada a la zona horaria de Colombia
    const fechaColombia = new Date(`${fechaSeleccionada}T00:00:00-05:00`);
    const fechaISO = fechaColombia.toISOString().split("T")[0]; // YYYY-MM-DD

    const response = await fetch(`${API_BASE}/por-fecha/${fechaISO}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("⚠️ Error al buscar órdenes:", response.status, response.statusText);
      console.error("🧩 Respuesta del servidor:", errorText);
      alert(`Error al buscar órdenes: ${response.statusText}`);
      return;
    }

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
  if (!fechaSeleccionada) {
    alert("Selecciona una fecha antes de cerrar la caja.");
    return;
  }

  const confirmacion = confirm(`¿Seguro que deseas cerrar la caja del día ${fechaSeleccionada}?`);
  if (!confirmacion) return;

  try {
    const response = await fetch(`${API_BASE}/cerrar-caja`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha: fechaSeleccionada })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("⚠️ Error al cerrar caja:", response.status, response.statusText);
      console.error("🧩 Contenido de la respuesta del servidor:", errorText);
      alert(`Error al cerrar caja: ${response.statusText}`);
      return;
    }

    const data = await response.json();
    console.log("✅ Caja cerrada con éxito:", data);

    if (data.caja) {
      alert(`✅ Caja cerrada con éxito.\nTotal del día: $${data.caja.totalDia.toLocaleString()}`);
    } else {
      alert("⚠️ Caja cerrada, pero sin datos de total.");
    }
  } catch (error) {
    console.error("💥 Error cerrando caja:", error);
    alert("❌ Error al cerrar la caja (ver consola para más detalles).");
  }
});

// 📅 Reporte diario (envía correo con PDF)
reporteDiarioBtn.addEventListener("click", async () => {
  const fechaInputValor = fechaInput.value;
  if (!fechaInputValor) {
    alert("Selecciona una fecha para generar el reporte diario.");
    return;
  }

  const correoDestino = prompt(
    "Introduce el correo donde enviar el reporte:",
    "santiagoacostaavila2905@gmail.com"
  );
  if (!correoDestino) return;

  // ✅ Ajustar la fecha seleccionada al horario de Colombia
  const fechaColombia = new Date(`${fechaInputValor}T00:00:00-05:00`);

  try {
    const response = await fetch(API_REPORTES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: fechaColombia.toISOString(), // ✅ Enviamos en formato ISO correcto
        correo: correoDestino,
        tipo: "diario",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert(`📧 Reporte diario enviado correctamente a ${correoDestino}`);
    } else {
      console.error("⚠️ Error en reporte diario:", data);
      if (data.error === "No hay órdenes para esa fecha") {
        alert("❌ No hay órdenes registradas para la fecha seleccionada.");
      } else {
        alert("❌ Error al generar o enviar el reporte diario.");
      }
    }
  } catch (error) {
    console.error("💥 Error reporte diario:", error);
    alert("❌ Error al enviar el reporte diario.");
  }
});

// 📆 Reporte mensual (envía correo con PDF)
reporteMensualBtn.addEventListener("click", async () => {
  const mes = prompt("Introduce el mes (YYYY-MM):");
  if (!mes) return;

  const correoDestino = prompt(
    "Introduce el correo donde enviar el reporte:",
    "dueno@restaurante.com"
  );
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
      alert("❌ Error al generar o enviar el reporte mensual.");
    }
  } catch (error) {
    console.error("💥 Error reporte mensual:", error);
    alert("❌ Error al enviar el reporte mensual.");
  }
});
