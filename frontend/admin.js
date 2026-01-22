import { API_URL } from "./config.js";

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
  try {
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Error al cargar productos");

    const productos = await res.json();
    renderProductos(productos);
  } catch (err) {
    console.error("💥 Error cargando productos:", err);
  }

  const productosBajoStock = productos.filter(p => p.stock <= 5);

  if (productosBajoStock.length > 0) {
    const nombres = productosBajoStock
      .map(p => `${p.name} (${p.stock})`)
      .join("\n");

    alert(
      `⚠️ Productos con stock bajo:\n\n${nombres}`
    );
  }
}

// 🔹 Renderizar productos
function renderProductos(productos) {
  tableBody.innerHTML = "";

  productos.forEach((p) => {
    const row = document.createElement("tr");

    let stockClass = "stock-ok";

    if (p.stock <= 5) {
      stockClass = "stock-danger";
    } else if (p.stock <= 10) {
      stockClass = "stock-warning";
    }

    row.innerHTML = `
      <td>${p.name}</td>
      <td>${p.price}</td>
      <td class="${stockClass}">
        ${p.stock}
      </td>
      <td>
        <button class="btn-edit">✏️</button>
        <button class="btn-delete">🗑️</button>
      </td>
    `;

    // ✅ Agregar listeners a los botones
    row.querySelector(".btn-edit").addEventListener("click", () => editProducto(p._id));
    row.querySelector(".btn-delete").addEventListener("click", () => deleteProducto(p._id));

    tableBody.appendChild(row);
  });
}

// 🔹 Buscar en vivo
searchBox.addEventListener("input", async () => {
  const q = searchBox.value.toLowerCase();

  try {
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Error al buscar productos");

    const productos = await res.json();
    const filtrados = productos.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
    renderProductos(filtrados);
  } catch (err) {
    console.error("💥 Error buscando productos:", err);
  }
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
    stock: Number(stockInput.value),
  };

  try {
    const url = productIdInput.value
      ? `${API_URL}/${productIdInput.value}`
      : API_URL;

    const method = productIdInput.value ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Error guardando producto");

    modal.classList.add("hidden");
    loadProductos();
  } catch (err) {
    console.error("💥 Error guardando producto:", err);
    alert("No se pudo guardar el producto.");
  }
});

// 🔹 Editar producto
async function editProducto(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("No se pudo obtener el producto");

    const producto = await res.json();

    modalTitle.textContent = "Editar Producto";
    productIdInput.value = producto._id;
    categoryInput.value = producto.category;
    nameInput.value = producto.name;
    priceInput.value = producto.price;
    stockInput.value = producto.stock;

    modal.classList.remove("hidden");
  } catch (error) {
    console.error("💥 Error al editar producto:", error);
    alert("No se pudo cargar el producto.");
  }
}

// 🔹 Eliminar producto
async function deleteProducto(id) {
  if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("No se pudo eliminar el producto");

    loadProductos();
  } catch (error) {
    console.error("💥 Error eliminando producto:", error);
    alert("No se pudo eliminar el producto.");
  }
}

// 🔹 Inicializar
loadProductos();
