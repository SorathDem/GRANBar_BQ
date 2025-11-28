import { API_AUTH_LOGIN, API_BASE, API_REPORTES, API_URL } from "./config.js";

const productosContainer = document.getElementById("productos-container");
const ordenLista = document.getElementById("orden-lista");
const enviarOrdenBtn = document.getElementById("enviarOrdenBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Array donde se guarda la orden actual
let orden = [];
let productosGlobal = [];

// 🔹 1. Cargar productos desde MongoDB
async function cargarProductos() {
  try {
    const response = await fetch(API_URL);
    const productos = await response.json();
    productosGlobal = productos;
    mostrarProductos(productosGlobal);
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

// 🔹 Función que renderiza productos
function mostrarProductos(lista) {
  productosContainer.innerHTML = "";

  lista.forEach((producto) => {
    const card = document.createElement("div");
    card.classList.add("producto-card");

    card.innerHTML = `
      <p> ${producto.name} 
          $${producto.price} </p>
      <button class="agregarBtn">Agregar</button>
    `;

    card.querySelector(".agregarBtn").addEventListener("click", () => {
      agregarAOrden(producto);
      mostrarNotificacion(`✅ ${producto.name} agregado a la orden`, "#27ae60");
    });

    productosContainer.appendChild(card);
  });
}

// 🔹 2. Agregar producto a la orden
function agregarAOrden(producto) {
  const existente = orden.find((p) => p._id === producto._id);
  if (existente) {
    existente.cantidad++;
  } else {
    orden.push({ ...producto, cantidad: 1, nota: "" });
  }
  renderOrden();
}

// 🔹 3. Renderizar la orden
function renderOrden() {
  ordenLista.innerHTML = "";

  orden.forEach((producto, index) => {
    const item = document.createElement("div");
    item.classList.add("orden-item");

    item.innerHTML = `
      <p><strong>${producto.name}</strong> - $${producto.price}</p>
      <textarea placeholder="Recomendaciones..." data-index="${index}">${producto.nota}</textarea>
      <div class="cantidad-control">
        <button class="menos">−</button>
        <span>${producto.cantidad}</span>
        <button class="mas">+</button>
      </div>
      <button class="quitarBtn">❌ Quitar</button>
    `;

    item.querySelector(".menos").addEventListener("click", () => {
      if (producto.cantidad > 1) producto.cantidad--;
      else orden.splice(index, 1);
      renderOrden();
    });

    item.querySelector(".mas").addEventListener("click", () => {
      producto.cantidad++;
      renderOrden();
    });

    item.querySelector(".quitarBtn").addEventListener("click", () => {
      orden.splice(index, 1);
      renderOrden();
    });

    item.querySelector("textarea").addEventListener("input", (e) => {
      producto.nota = e.target.value;
    });

    ordenLista.appendChild(item);
  });
}

// 🔹 4. Enviar la orden
enviarOrdenBtn.addEventListener("click", async () => {
  if (orden.length === 0) {
    mostrarNotificacion("No hay productos en la orden", "#f39c12");
    return;
  }

  const mesa = document.getElementById("mesa").value;
  if (!mesa) {
    mostrarNotificacion("Debes seleccionar una mesa", "#f39c12");
    return;
  }

  const payload = {
    mesa,
    items: orden.map((it) => ({               // ← AQUÍ ESTABA EL ERROR
      _id: it._id,
      tipo: it.category || "",
      nombre: it.name,
      cantidad: it.cantidad,
      precio: it.price,
      recomendaciones: it.nota || "",
    })),
  };

  try {
    const resp = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (resp.ok) {
      const data = await resp.json();
      console.log("Orden creada con éxito:", data);

      mostrarNotificacion("Orden enviada a cocina", "#27ae60");
      orden = [];
      renderOrden();
      document.getElementById("mesa").value = "";

      // Opcional: forzar impresión inmediata
      setTimeout(async () => {
        try {
          await fetch(`${API_BASE}/${data.orden._id}/imprimir`, { method: "PATCH" });
        } catch (e) { console.log("Ya se imprimió o no hay worker"); }
      }, 800);

      setTimeout(() => location.reload(), 1800);
    } else {
      const error = await resp.text();
      console.error("Error del servidor:", error);
      mostrarNotificacion("Error al enviar orden", "#e74c3c");
    }
  } catch (err) {
    console.error("Error de conexión:", err);
    mostrarNotificacion("Sin conexión al servidor", "#e74c3c");
  }
});

// 🔹 5. Filtro en tiempo real
const buscador = document.getElementById("buscador");
if (buscador) {
  buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase().trim();
    const filtrados = productosGlobal.filter((p) =>
      p.name.toLowerCase().includes(texto) ||
      p.category.toLowerCase().includes(texto)
    );
    mostrarProductos(filtrados);
  });
}

// 🔹 6. Cerrar sesión
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

const mesaSelect = document.getElementById("mesa");

// Opción inicial vacía
const opcionDefault = document.createElement("option");
opcionDefault.value = "";
opcionDefault.textContent = "Selecciona una mesa...";
opcionDefault.disabled = true;
opcionDefault.selected = true;
mesaSelect.appendChild(opcionDefault);

// Generar mesas del 1 al 20
for (let i = 1; i <= 20; i++) {
  const option = document.createElement("option");
  option.value = i;
  option.textContent = `Mesa ${i}`;
  mesaSelect.appendChild(option);
}

// 🔹 8. Notificaciones
function mostrarNotificacion(mensaje, color = "#3498db") {
  const noti = document.createElement("div");
  noti.classList.add("notificacion");
  noti.textContent = mensaje;
  noti.style.background = color;
  document.body.appendChild(noti);
  setTimeout(() => noti.remove(), 2500);
}

// 🔹 9. Inicializar
cargarProductos();
