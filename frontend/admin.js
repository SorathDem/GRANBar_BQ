import { API_AUTH_LOGIN, API_URL, API_BASE, API_REPORTES } from "./config.js";

const token = localStorage.getItem("token");

// Si no hay token, redirigir a login
if (!token) {
  window.location.href = "login.html";
}

const tableBody = document.querySelector("#productosTable tbody");
const searchBox = document.getElementById("searchBox");
const addProductBtn = document.getElementById("addProductBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Modal
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const closeModal = document.getElementById("closeModal");
const productForm = document.getElementById("productForm");
const productIdInput = document.getElementById("productId");
const categoryInput = document.getElementById("category");
const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const stockInput = document.getElementById("stock");

// 🔹 Cerrar sesión
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// 🔹 Cargar productos
async function loadProductos() {
  const res = await fetch(API_URL, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const productos = await res.json();
  renderProductos(productos);
}

function renderProductos(productos) {
  tableBody.innerHTML = "";
  productos.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.name}</td>
      <td>${p.price}</td>
      <td>${p.stock}</td>
      <td>
        <button onclick="editProducto('${p._id}')">✏️</button>
        <button onclick="deleteProducto('${p._id}')">🗑️</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// 🔹 Buscar en vivo
searchBox.addEventListener("input", async () => {
  const q = searchBox.value.toLowerCase();
  const res = await fetch(API_URL, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const productos = await res.json();
  const filtrados = productos.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.category || "").toLowerCase().includes(q)
  );
  renderProductos(filtrados);
});

// 🔹 Abrir modal para agregar producto
addProductBtn.addEventListener("click", () => {
  modalTitle.textContent = "Agregar Producto";
  productIdInput.value = "";
  categoryInput.value = "";
  nameInput.value = "";
  priceInput.value = "";
  stockInput.value = "";
  modal.classList.remove("hidden");
});

// 🔹 Cerrar modal
closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// 🔹 Guardar producto (crear o actualizar)
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    category: categoryInput.value,
    name: nameInput.value,
    price: Number(priceInput.value),
    stock: Number(stockInput.value)
  };

  if (productIdInput.value) {
    // Actualizar
    await fetch(`${API_URL}/${productIdInput.value}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  } else {
    // Crear
    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
  }

  modal.classList.add("hidden");
  loadProductos();
});

// 🔹 Editar producto
async function editProducto(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const producto = await res.json();

  modalTitle.textContent = "Editar Producto";
  productIdInput.value = producto._id;
  categoryInput.value = producto.category;
  nameInput.value = producto.name;
  priceInput.value = producto.price;
  stockInput.value = producto.stock;

  modal.classList.remove("hidden");
}

// 🔹 Eliminar producto
async function deleteProducto(id) {
  if (confirm("¿Seguro que deseas eliminar este producto?")) {
    await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    loadProductos();
  }
}

// Llamar al inicio
loadProductos();
