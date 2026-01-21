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

const modal = document.getElementById("modalReporte");
const abrir = document.getElementById("abrirReporte");
const cerrar = document.getElementById("cerrarReporte");

const diarioBox = document.getElementById("diarioBox");
const mensualBox = document.getElementById("mensualBox");

abrir.addEventListener("click", () => {
  modal.style.display = "flex";
});

cerrar.addEventListener("click", () => {
  modal.style.display = "none";
});

document.querySelectorAll("input[name='tipoReporte']").forEach(radio => {
  radio.addEventListener("change", () => {
    diarioBox.style.display = radio.value === "diario" && radio.checked ? "block" : "none";
    mensualBox.style.display = radio.value === "mensual" && radio.checked ? "block" : "none";
  });
});

document.getElementById("generarReporte").addEventListener("click", () => {
  const tipo = document.querySelector("input[name='tipoReporte']:checked").value;

  if (tipo === "diario") {
    const fecha = document.getElementById("fechaDiaria").value;
    if (!fecha) return alert("Seleccione una fecha");

    window.open(`${API_CAJAS}/reporte/diario?fecha=${fecha}`, "_blank");
  }

  if (tipo === "mensual") {
    const fecha = document.getElementById("fechaMensual").value;
    if (!fecha) return alert("Seleccione mes y año");

    const [year, month] = fecha.split("-");
    window.open(`${API_CAJAS}/reporte/mensual?year=${year}&month=${month}`, "_blank");
  }

  modal.style.display = "none";
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

      fila.appendChild(celdaBotones);
      tbody.appendChild(fila);
    });
  } catch (error) {
    console.error("❌ Error:", error);
    mensaje.textContent = "Ocurrió un error al cargar los cierres.";
  }
}

document.addEventListener("DOMContentLoaded", cargarCierres);
