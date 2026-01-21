import { API_AUTH_LOGIN, API_URL, API_BASE, API_REPORTES } from "./config.js";

const fechaInput = document.getElementById("fecha");
const buscarBtn = document.getElementById("buscar");
const cerrarCajaBtn = document.getElementById("cerrarCaja");
const tablaBody = document.querySelector("#tablaOrdenes tbody");
const totalDiaDiv = document.getElementById("totalDia");
const logoutBtn = document.getElementById("logoutBtn");

// === ELEMENTOS DEL MODAL (ESTABAN FALTANDO) ===
const modalEditar = document.getElementById("modalEditar");
const editMesa = document.getElementById("editMesa");
const editTotal = document.getElementById("editTotal");
const editFecha = document.getElementById("editFecha");
const editMetodoPago = document.getElementById("editMetodoPago");
const guardarCambiosBtn = document.getElementById("guardarCambios");
const cancelarEdicionBtn = document.getElementById("cancelarEdicion");

let ordenEditando = null;


// ================================
// MODAL NUEVA FACTURA (AISLADO)
// ================================

const nfModal = document.getElementById("modalNuevaFactura");

const nfMesa = document.getElementById("addMesa");
const nfMetodoPago = document.getElementById("addMetodoPago");
const nfFecha = document.getElementById("addFecha");

const nfSelectProductos = document.getElementById("addSelectProductos");
const nfProductosContainer = document.getElementById("addProductosContainer");
const nfTotal = document.getElementById("addTotal");

const nfBtnNuevaFactura = document.getElementById("btnNuevaFactura");
const nfBtnAgregarProducto = document.getElementById("addBtnAgregarProducto");
const nfBtnGuardar = document.getElementById("btnGuardarNuevaFactura");
const nfBtnCancelar = document.getElementById("btnCancelarNuevaFactura");

let nfItems = [];

// === IMPRIMIR FACTURA (YA ESTÁ BIEN, PERO LA MANTENEMOS) ===
async function imprimirFactura(orderId) {
  if (!confirm("¿Imprimir factura para esta orden?")) return;

  try {
    const response = await fetch(`${API_BASE}/${orderId}/imprimir-factura`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Error del servidor");
    }

    const data = await response.json();
    console.log("Factura enviada:", data);

    alert("Factura enviada a impresión");
    
    // Recargar la tabla para ver el cambio de estado
    buscarOrdenesPorFecha(fechaInput.value);

  } catch (error) {
    console.error("Error enviando factura:", error);
    alert("Error: " + error.message);
  }
}

// === RENDERIZAR ÓRDENES CON BOTÓN DE IMPRIMIR FACTURA ===
function renderOrdenes(ordenes) {
  tablaBody.innerHTML = "";
  let total = 0;

  ordenes.forEach((orden) => {
    const fila = document.createElement("tr");

    const productos = orden.items
      .map((p) => `${p.nombre} (${p.cantidad})${p.recomendaciones ? " — " + p.recomendaciones : ""}`)
      .join("<br>");

    function formatearFecha(fecha) {
      const [y, m, d] = fecha.split("-");
      return `${d}/${m}/${y}`;
    }
    const fechaLocal = formatearFecha(orden.fecha);

    // === BOTONES ===
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Pagar";
    btnEditar.style.marginRight = "6px";
    btnEditar.addEventListener("click", () => abrirModalEdicion(orden));

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.style.background = "red";
    btnEliminar.style.color = "white";
    btnEliminar.style.marginRight = "6px";
    btnEliminar.addEventListener("click", () => eliminarOrden(orden._id));

    // NUEVO BOTÓN DE FACTURA
    const btnImprimirFactura = document.createElement("button");
    btnImprimirFactura.textContent = "Imprimir Factura";
    btnImprimirFactura.style.background = "#27ae60";
    btnImprimirFactura.style.color = "white";
    btnImprimirFactura.style.padding = "6px 10px";
    btnImprimirFactura.style.fontSize = "12px";
    btnImprimirFactura.style.border = "none";
    btnImprimirFactura.style.borderRadius = "4px";
    btnImprimirFactura.style.cursor = "pointer";
    btnImprimirFactura.addEventListener("click", () => imprimirFactura(orden._id));

    const celdaAcciones = document.createElement("td");
    celdaAcciones.appendChild(btnEditar);
    celdaAcciones.appendChild(btnEliminar);
    celdaAcciones.appendChild(btnImprimirFactura);

    fila.innerHTML = `
      <td>${orden.mesa || "N/A"}</td>
      <td>${orden.metodoPago || "efectivo"}</td>
      <td style="text-align:left;">${productos}</td>
      <td>$${Number(orden.total).toLocaleString()}</td>
      <td>${fechaLocal}</td>
    `;
    fila.appendChild(celdaAcciones);
    tablaBody.appendChild(fila);

    total += Number(orden.total);
  });

  totalDiaDiv.textContent = `Total del día: $${total.toLocaleString()}`;
  const totalesMetodo = calcularTotalesPorMetodo(ordenes);
  const divMetodo = document.getElementById("totalesMetodoPago");

  divMetodo.innerHTML = `
    <strong>Totales por método de pago:</strong><br>
    💵 Efectivo: $${totalesMetodo.efectivo.toLocaleString("es-CO")}<br>
    💳 Tarjeta: $${totalesMetodo.tarjeta.toLocaleString("es-CO")}<br>
    🔁 Transferencia: $${totalesMetodo.transferencia.toLocaleString("es-CO")}<br>
    📱 Nequi: $${totalesMetodo.nequi.toLocaleString("es-CO")}<br>
    📱 Daviplata: $${totalesMetodo.daviplata.toLocaleString("es-CO")}
  `;
}


// === TUS DEMÁS FUNCIONES (SIN CAMBIOS) ===
async function buscarOrdenesPorFecha(fechaSeleccionada) {
  if (!fechaSeleccionada) {
    alert("Por favor selecciona una fecha.");
    return;
  }
  try {
    const fechaColombia = new Date(`${fechaSeleccionada}T00:00:00-05:00`);
    const fechaISO = fechaColombia.toISOString().split("T")[0];
    const response = await fetch(`${API_BASE}/por-fecha/${fechaISO}`);
    if (!response.ok) throw new Error(await response.text());
    const ordenes = await response.json();
    if (!Array.isArray(ordenes) || ordenes.length === 0) {
      tablaBody.innerHTML = `<tr><td colspan="5">No se encontraron órdenes para esa fecha</td></tr>`;
      totalDiaDiv.textContent = "";
      return;
    }
    renderOrdenes(ordenes);
  } catch (error) {
    console.error("Error al buscar órdenes:", error);
    alert("Error al buscar las órdenes del día.");
  }
}

buscarBtn.addEventListener("click", () => {
  buscarOrdenesPorFecha(fechaInput.value);
});

// === CATÁLOGO DE PRODUCTOS ===
const selectProductos = document.getElementById("selectProductos");
const contenedorProductos = document.getElementById("productosEditarContainer");

let itemsEditando = [];

async function cargarCatalogo() {
  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      throw new Error("Error al cargar productos");
    }

    const data = await res.json();

    // Soporta ambos formatos:
    const productos = Array.isArray(data)
      ? data
      : data.productos || [];

    selectProductos.innerHTML = "";

    if (productos.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = "No hay productos";
      selectProductos.appendChild(opt);
      return;
    }

    productos.forEach(p => {
      const productoNormalizado = {
        id: p._id || p.id,
        nombre: p.nombre || p.name || p.producto,
        precio: p.precio || p.price || p.valor || 0
      };

      const opt = document.createElement("option");
      opt.value = JSON.stringify(productoNormalizado);
      opt.textContent = `${productoNormalizado.nombre} - $${productoNormalizado.precio}`;
      selectProductos.appendChild(opt);
    });

  } catch (error) {
    console.error("❌ Error cargando catálogo:", error);
  }
}

document.getElementById("btnAgregarCatalogo").addEventListener("click", () => {
  if (!selectProductos.value) return;

  const producto = JSON.parse(selectProductos.value);

  const existente = itemsEditando.find(p => p.nombre === producto.nombre);

  if (existente) {
    existente.cantidad++;
  } else {
    itemsEditando.push({
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      recomendaciones: ""
    });
  }

  renderProductos();
  calcularTotal();
});

function renderProductos() {
  contenedorProductos.innerHTML = "";

  itemsEditando.forEach((item, index) => {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.padding = "8px";
    div.style.marginBottom = "6px";

    const inputNombre = document.createElement("input");
    inputNombre.value = item.nombre;
    inputNombre.addEventListener("input", e => {
      itemsEditando[index].nombre = e.target.value;
    });

    const inputCantidad = document.createElement("input");
    inputCantidad.type = "number";
    inputCantidad.min = 1;
    inputCantidad.value = item.cantidad;
    inputCantidad.addEventListener("input", e => {
      itemsEditando[index].cantidad = Number(e.target.value);
      calcularTotal();
    });

    const inputPrecio = document.createElement("input");
    inputPrecio.type = "number";
    inputPrecio.min = 0;
    inputPrecio.value = item.precio;
    inputPrecio.addEventListener("input", e => {
      itemsEditando[index].precio = Number(e.target.value);
      calcularTotal();
    });

    const inputRec = document.createElement("input");
    inputRec.placeholder = "Recomendaciones";
    inputRec.value = item.recomendaciones || "";
    inputRec.addEventListener("input", e => {
      itemsEditando[index].recomendaciones = e.target.value;
    });

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "🗑";
    btnEliminar.addEventListener("click", () => {
      itemsEditando.splice(index, 1);
      renderProductos();
      calcularTotal();
    });

    div.append(inputNombre, inputCantidad, inputPrecio, inputRec, btnEliminar);
    contenedorProductos.appendChild(div);
  });
}

function calcularTotalesPorMetodo(ordenes) {
  const totales = {
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
    nequi: 0,
    daviplata: 0
  };

  ordenes.forEach(o => {
    const metodo = (o.metodoPago || "efectivo").toLowerCase();
    if (totales[metodo] !== undefined) {
      totales[metodo] += Number(o.total || 0);
    }
  });

  return totales;
}

function calcularTotal() {
  const total = itemsEditando.reduce(
    (sum, item) => sum + item.cantidad * item.precio,
    0
  );
  editTotal.value = total;
}

function abrirModalEdicion(orden) {
  ordenEditando = orden;
  itemsEditando = JSON.parse(JSON.stringify(orden.items));

  editMesa.value = orden.mesa || "";
  editFecha.value = orden.fecha ? orden.fecha.split("T")[0] : "";
  editMetodoPago.value = orden.metodoPago || "efectivo";

  cargarCatalogo();
  renderProductos();
  calcularTotal();

  modalEditar.style.display = "flex";
}


// Cerrar caja
cerrarCajaBtn.addEventListener("click", async () => {
  const fechaSeleccionada = fechaInput.value;
  if (!fechaSeleccionada) return alert("Selecciona una fecha antes de cerrar la caja.");
  const confirmacion = confirm(`¿Seguro que deseas cerrar la caja del día ${fechaSeleccionada}?`);
  if (!confirmacion) return;
  try {
    const response = await fetch(`${API_BASE}/cerrar-caja`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha: fechaSeleccionada }),
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    alert(`Caja cerrada.\nTotal del día: $${data.caja.totalDia.toLocaleString()}`);
  } catch (error) {
    console.error("Error cerrando caja:", error);
    alert("Error al cerrar la caja.");
  }
});

cancelarEdicionBtn.addEventListener("click", () => {
  modalEditar.style.display = "none";
  ordenEditando = null;
});

guardarCambiosBtn.addEventListener("click", async () => {
  if (!ordenEditando) return;
    const datos = {
      mesa: editMesa.value,
      fecha: editFecha.value,
      metodoPago: editMetodoPago.value,
      items: itemsEditando,
      total: Number(editTotal.value)
    };
  try {
    const res = await fetch(`${API_BASE}/${ordenEditando._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    if (!res.ok) throw new Error("Error actualizando");
    alert("Orden actualizada");
    modalEditar.style.display = "none";
    buscarOrdenesPorFecha(fechaInput.value);
  } catch (err) {
    alert("Error al guardar cambios");
  }
});

async function eliminarOrden(id) {
  if (!confirm("¿Seguro que deseas eliminar esta orden?")) return;
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error eliminando");
    alert("Orden eliminada");
    buscarOrdenesPorFecha(fechaInput.value);
  } catch (err) {
    alert("Error al eliminar");
  }
}


//NUEVA FACTURA
async function nfCargarCatalogo() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error cargando catálogo");

    const data = await res.json();
    const productos = Array.isArray(data) ? data : data.productos || [];

    nfSelectProductos.innerHTML = "";

    if (productos.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = "No hay productos";
      nfSelectProductos.appendChild(opt);
      return;
    }

    productos.forEach(p => {
      const producto = {
        nombre: p.nombre || p.name || p.producto,
        precio: p.precio || p.price || p.valor || 0
      };

      const opt = document.createElement("option");
      opt.value = JSON.stringify(producto);
      opt.textContent = `${producto.nombre} - $${producto.precio}`;
      nfSelectProductos.appendChild(opt);
    });

  } catch (err) {
    console.error("❌ Error catálogo nueva factura:", err);
  }
}


nfBtnNuevaFactura.addEventListener("click", () => {
  if (!fechaInput.value) {
    return alert("Selecciona una fecha primero");
  }

  nfItems = [];

  nfMesa.value = "";
  nfMetodoPago.value = "efectivo";
  nfFecha.value = fechaInput.value;
  nfTotal.value = 0;

  nfProductosContainer.innerHTML = "";

  nfCargarCatalogo();
  nfRenderProductos();

  nfModal.style.display = "flex";
});


nfBtnAgregarProducto.addEventListener("click", () => {
  if (!nfSelectProductos.value) return;

  const producto = JSON.parse(nfSelectProductos.value);

  const existente = nfItems.find(p => p.nombre === producto.nombre);

  if (existente) {
    existente.cantidad++;
  } else {
    nfItems.push({
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      recomendaciones: ""
    });
  }

  nfRenderProductos();
  nfCalcularTotal();
});


function nfRenderProductos() {
  nfProductosContainer.innerHTML = "";

  nfItems.forEach((item, index) => {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.padding = "8px";
    div.style.marginBottom = "6px";

    const nombre = document.createElement("input");
    nombre.value = item.nombre;
    nombre.oninput = e => nfItems[index].nombre = e.target.value;

    const cantidad = document.createElement("input");
    cantidad.type = "number";
    cantidad.min = 1;
    cantidad.value = item.cantidad;
    cantidad.oninput = e => {
      nfItems[index].cantidad = Number(e.target.value);
      nfCalcularTotal();
    };

    const precio = document.createElement("input");
    precio.type = "number";
    precio.min = 0;
    precio.value = item.precio;
    precio.oninput = e => {
      nfItems[index].precio = Number(e.target.value);
      nfCalcularTotal();
    };

    const rec = document.createElement("input");
    rec.placeholder = "Recomendaciones";
    rec.value = item.recomendaciones || "";
    rec.oninput = e => nfItems[index].recomendaciones = e.target.value;

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "🗑";
    btnEliminar.onclick = () => {
      nfItems.splice(index, 1);
      nfRenderProductos();
      nfCalcularTotal();
    };

    div.append(nombre, cantidad, precio, rec, btnEliminar);
    nfProductosContainer.appendChild(div);
  });
}

function nfCalcularTotal() {
  nfTotal.value = nfItems.reduce(
    (sum, item) => sum + item.cantidad * item.precio,
    0
  );
}

nfBtnGuardar.addEventListener("click", async () => {
  if (!nfMesa.value || nfItems.length === 0) {
    return alert("Faltan datos");
  }

  const payload = {
    mesa: nfMesa.value,
    metodoPago: nfMetodoPago.value,
    fecha: nfFecha.value,
    items: nfItems,
    total: Number(nfTotal.value)
  };

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Error creando factura");

    nfModal.style.display = "none";
    buscarOrdenesPorFecha(nfFecha.value);

    alert("✅ Factura creada correctamente");

  } catch (err) {
    console.error(err);
    alert("❌ Error al crear factura");
  }
});

nfBtnCancelar.addEventListener("click", () => {
  nfModal.style.display = "none";
  nfItems = [];
});


// Cerrar sesión
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// Auto-cargar fecha desde URL
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const fechaURL = params.get("fecha");
  if (fechaURL) {
    fechaInput.value = fechaURL;
    buscarOrdenesPorFecha(fechaURL);
  }
});