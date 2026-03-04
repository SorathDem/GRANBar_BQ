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

// 🔹 Pintar órdenes una debajo de otra
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
      <h2>Mesa ${orden.mesa}</h2>
      <p><strong>Estado:</strong> ${orden.estado}</p>

      <ul>
        ${orden.items.map(item => `
          <li>
            ${item.nombre} x${item.cantidad}
            ${item.recomendaciones ? `<br><small>${item.recomendaciones}</small>` : ""}
          </li>
        `).join("")}
      </ul>
    `;

    container.appendChild(card);
  });
}

// 🔹 Actualizar cada 4 segundos
setInterval(cargarOrdenes, 4000);

// 🔹 Inicializar
cargarOrdenes();

// 🔹 Cerrar sesión
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});