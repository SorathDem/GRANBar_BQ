import { API_AUTH_LOGIN, API_BASE, API_REPORTES, API_URL } from "./config.js";

const productosContainer = document.getElementById("productos-container");
const ordenLista = document.getElementById("orden-lista");
const enviarOrdenBtn = document.getElementById("enviarOrdenBtn");

// Array donde se guarda la orden actual
let orden = [];
let productosGlobal = []; // guardará todos los productos cargados

// 🔹 1. Cargar productos desde MongoDB
async function cargarProductos() {
  try {
    const response = await fetch(API_URL);
    const productos = await response.json();

    productosGlobal = productos; // guardar todos los productos
    mostrarProductos(productosGlobal); // renderizar productos
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

// 🔹 Función que renderiza productos en el contenedor
function mostrarProductos(lista) {
  productosContainer.innerHTML = ""; // limpiar antes de renderizar

  lista.forEach((producto) => {
    const card = document.createElement("div");
    card.classList.add("producto-card");

    card.innerHTML = `
      <p><strong>Nombre:</strong>${producto.name} <strong>Categoría:</strong> ${producto.category} <strong>Precio:</strong> $${producto.price} <strong>Stock:</strong> ${producto.stock}</p>
      <button class="agregarBtn">Agregar</button>
    `;

    // Evento para agregar producto a la orden
    card.querySelector(".agregarBtn").addEventListener("click", () => {
      agregarAOrden(producto);
      mostrarNotificacion(`✅ ${producto.name} agregado a la orden`);
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

// 🔹 3. Renderizar la lista de orden
function renderOrden() {
  ordenLista.innerHTML = "";

  orden.forEach((producto, index) => {
    const item = document.createElement("div");
    item.classList.add("orden-item");

    item.innerHTML = `
      <p><strong>${producto.name}</strong> (${producto.category}) - $${producto.price}</p>
      <textarea placeholder="Recomendaciones..." data-index="${index}">${producto.nota}</textarea>
      <div class="cantidad-control">
        <button class="menos">−</button>
        <span>${producto.cantidad}</span>
        <button class="mas">+</button>
      </div>
      <button class="quitarBtn">❌ Quitar</button>
    `;

    // Eventos
    item.querySelector(".menos").addEventListener("click", () => {
      if (producto.cantidad > 1) {
        producto.cantidad--;
      } else {
        orden.splice(index, 1);
      }
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
document.getElementById("enviarOrdenBtn").addEventListener("click", async () => {
  if (orden.length === 0) {
    mostrarNotificacion("⚠️ No hay productos en la orden", "#f39c12");
    return;
  }

  const mesaInput = document.getElementById("mesa").value.trim();

  if (!mesaInput) {
    mostrarNotificacion("⚠️ Debes seleccionar una mesa antes de enviar la orden", "#f39c12");
    return;
  }

  const payload = {
    mesa: mesaInput,
    productos: orden.map(it => ({
      _id: it._id,
      tipo: it.category || "", 
      nombre: it.name,
      cantidad: it.cantidad,
      precio: it.price,
      recomendaciones: it.nota || ""
    }))
  };

  try {
    const resp = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (resp.ok) {
      mostrarNotificacion("✅ Orden enviada para impresión", "#27ae60");
      orden = [];
      renderOrden();
      setTimeout(() => location.reload(), 1500);
    } else {
      mostrarNotificacion("❌ Error al enviar la orden", "#e74c3c");
      console.error("Error respuesta:", await resp.text());
    }
  } catch (err) {
    console.error(err);
    mostrarNotificacion("❌ Error de conexión", "#e74c3c");
  }
});

// 🔹 5. Filtro en tiempo real (barra de búsqueda)
const buscador = document.getElementById("buscador");
if (buscador) {
  buscador.addEventListener("input", () => {
    const texto = buscador.value.toLowerCase().trim();

    // 🔎 Filtrar productos ya cargados
    const productosFiltrados = productosGlobal.filter((p) => {
      const nombre = p.name.toLowerCase();
      const categoria = p.category.toLowerCase();
      return nombre.includes(texto) || categoria.includes(texto);
    });

    mostrarProductos(productosFiltrados);
  });
}

// 🔹 6. Notificaciones
function mostrarNotificacion(mensaje, color = "#3498db") {
  const noti = document.createElement("div");
  noti.classList.add("notificacion");
  noti.textContent = mensaje;
  noti.style.background = color;

  document.body.appendChild(noti);
  setTimeout(() => noti.remove(), 2500);
}

// 🔹 7. Iniciar carga
cargarProductos();
