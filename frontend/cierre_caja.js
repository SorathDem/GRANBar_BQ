const API_CAJAS = "https://granbar-bq.onrender.com/api/cajas";

const tbody = document.getElementById("tbodyCierres");
const mensaje = document.getElementById("mensaje");

function formatearFecha(fecha) {
  if (!fecha) return "";

  if (fecha.includes("T")) {
    fecha = fecha.split("T")[0];
  }

  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

/* =====================
         BOTÓN GENERAR REPORTE
      ===================== */
      const botonReporte = document.createElement("button");
      botonReporte.textContent = "Generar reporte";
      botonReporte.style.marginLeft = "6px";

      botonReporte.addEventListener("click", () => {
        const tipo = prompt(
          "Seleccione el tipo de reporte:\n" +
          "d → Diario\n" +
          "m → Mensual"
        );

        // 📅 REPORTE DIARIO
        if (tipo === "d") {
          const fecha = prompt("Ingrese la fecha (YYYY-MM-DD)");
          if (!fecha) {
            alert("Fecha inválida");
            return;
          }

          window.open(
            `${API_CAJAS}/reporte/diario?fecha=${fecha}`,
            "_blank"
          );
        }

        // 📆 REPORTE MENSUAL
        if (tipo === "m") {
          const year = prompt("Ingrese el año (YYYY)");
          const month = prompt("Ingrese el mes (01-12)");

          if (!year || !month) {
            alert("Año o mes inválido");
            return;
          }

          window.open(
            `${API_CAJAS}/reporte/mensual?year=${year}&month=${month}`,
            "_blank"
          );
        }
      });
      
async function cargarCierres() {
  try {
    const res = await fetch(API_CAJAS);
    if (!res.ok) throw new Error("Error al obtener cierres de caja");

    const data = await res.json();
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      mensaje.textContent = "No hay cierres de caja registrados aún.";
      return;
    }

    mensaje.textContent = "";

    data.forEach(caja => {
      const fila = document.createElement("tr");

      const totalDia = caja.totalDia || 0;
      const cantidadOrdenes = caja.cantidadOrdenes || 0;

      const fechaISO = caja.fecha.includes("T")
        ? caja.fecha.split("T")[0]
        : caja.fecha;

      const fechaFormateada = formatearFecha(fechaISO);

      /* =====================
         BOTÓN VER ÓRDENES
      ===================== */
      const botonVer = document.createElement("button");
      botonVer.textContent = "Ver órdenes";
      botonVer.addEventListener("click", () => {
        window.location.href = `./caja.html?fecha=${fechaISO}`;
      });

      fila.innerHTML = `
        <td>${fechaFormateada}</td>
        <td>$${totalDia.toLocaleString("es-CO")}</td>
        <td>${cantidadOrdenes}</td>
      `;

      const celdaBotones = document.createElement("td");
      celdaBotones.appendChild(botonVer);
      celdaBotones.appendChild(botonReporte);

      fila.appendChild(celdaBotones);
      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error("❌ Error:", error);
    mensaje.textContent = "Ocurrió un error al cargar los cierres.";
  }
}

document.addEventListener("DOMContentLoaded", cargarCierres);
