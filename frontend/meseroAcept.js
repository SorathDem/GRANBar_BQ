const API_ORDENES = "/api/ordenesD";
const container = document.getElementById("ordenesContainer");


// 🔹 Obtener órdenes
async function cargarOrdenes() {
  try {
    const resp = await fetch(API_ORDENES);
    const ordenes = await resp.json();

    renderOrdenes(ordenes);

  } catch (error) {
    console.error("Error cargando órdenes:", error);
  }
}


// 🔹 Pintar órdenes en pantalla
function renderOrdenes(lista) {
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>No hay órdenes activas</p>";
    return;
  }

  lista.forEach(orden => {
    const card = document.createElement("div");
    card.classList.add("orden-card");

    card.innerHTML = `
      <h3>Mesa ${orden.mesa}</h3>
      <p><strong>Estado:</strong> ${orden.estado}</p>

      <ul>
        ${orden.items.map(item => `
          <li>
            ${item.nombre} x${item.cantidad}
            <br>
            <small>${item.recomendaciones || ""}</small>
          </li>
        `).join("")}
      </ul>

      <div class="botones">
        <button class="realizado">Realizado</button>
        <button class="cancelar">Cancelar</button>
      </div>
    `;

    // 🔹 Botón Realizado
    card.querySelector(".realizado").addEventListener("click", async () => {
      await eliminarOrden(orden._id);
      card.remove();
    });

    // 🔹 Botón Cancelar
    card.querySelector(".cancelar").addEventListener("click", async () => {
      await eliminarOrden(orden._id);
      card.remove();
    });

    container.appendChild(card);
  });
}


// 🔹 Eliminar orden de la colección
async function eliminarOrden(id) {
  try {
    await fetch(`${API_ORDENES}/${id}`, {
      method: "DELETE"
    });
  } catch (error) {
    console.error("Error eliminando orden:", error);
  }
}


// 🔹 Actualizar cada 4 segundos
setInterval(cargarOrdenes, 4000);


// 🔹 Inicializar
cargarOrdenes();