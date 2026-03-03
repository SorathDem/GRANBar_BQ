import { API_BASED } from "./config.js";

const contenedor = document.getElementById("ordenes-container");

async function cargarOrdenesPendientes() {
  try {
    const resp = await fetch(API_BASED);
    const data = await resp.json();

    const pendientes = data.filter(o => o.estado === "pendiente");

    renderOrdenes(pendientes);

  } catch (error) {
    console.error("Error cargando órdenes:", error);
  } 
}

function renderOrdenes(lista) {
  contenedor.innerHTML = "";

  lista.forEach(orden => {

    const card = document.createElement("div");
    card.classList.add("orden-card");

    card.innerHTML = `
      <h3>Mesa ${orden.mesa}</h3>
      <p><strong>Estado:</strong> ${orden.estado}</p>
      <ul>
        ${orden.items.map(i =>
          `<li>${i.nombre} x${i.cantidad}</li>`
        ).join("")}
      </ul>

      <button class="cancelar">Cancelar</button>
      <button class="listo">Plato listo</button>
    `;

    // 🔹 Botón cancelar
    card.querySelector(".cancelar").addEventListener("click", async () => {
      await cambiarEstado(orden._id, "cancelado");
      card.remove();
    });

    // 🔹 Botón plato listo
    card.querySelector(".listo").addEventListener("click", async () => {
      await cambiarEstado(orden._id, "listo");
      card.remove();
    });

    contenedor.appendChild(card);
  });
}

async function cambiarEstado(id, nuevoEstado) {
  try {
    await fetch(`${API_BASED}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado })
    });
  } catch (error) {
    console.error("Error actualizando estado:", error);
  }
}

cargarOrdenesPendientes();