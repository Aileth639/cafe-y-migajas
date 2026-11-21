
const API_URL = "https://6aff18b53a0e70bc8d5498bc.mockapi.io/v1/productos";

// contraseña y usuario"
const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

let productos = [];
let categoriaSeleccionada = "Todos";
let ventasRealizadas = [];
let ingresosTotales = 0;

// referencias dom
const catalogo = document.getElementById("catalogo");
const tablaAdminBody = document.getElementById("tablaAdminBody");
const panelAdmin = document.getElementById("panelAdmin");
const modalLogin = document.getElementById("modalLogin");
const btnAdministrarVentas = document.getElementById("btnAdministrarVentas");
const btnSalirAdmin = document.getElementById("btnSalirAdmin");
const cerrarModal = document.getElementById("cerrarModal");
const formLogin = document.getElementById("formLogin");
const mensajeErrorLogin = document.getElementById("mensajeErrorLogin");
const formProducto = document.getElementById("formProducto");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const totalVentasSpan = document.getElementById("totalVentas");
const totalIngresosSpan = document.getElementById("totalIngresos");
const listaVentasUl = document.getElementById("listaVentas");

document.addEventListener("DOMContentLoaded", cargarProductos);

// ---consultar y mostrar productos ---
async function cargarProductos() {
  try {
    const respuesta = await fetch(API_URL);
    productos = await respuesta.json();
    dibujarCatalogo();
    dibujarTablaAdmin();
  } catch (error) {
    console.error("Error al obtener productos:", error);
  }
}

// Vista del cliente
function dibujarCatalogo() {
  catalogo.innerHTML = "";

  const listaFiltrada = categoriaSeleccionada === "Todos"
    ? productos
    : productos.filter(p => p.categoria.toLowerCase() === categoriaSeleccionada.toLowerCase());

  listaFiltrada.forEach(prod => {
    const stockActual = Number(prod.stock);
    const agotado = stockActual <= 0;
    const vencimientoTexto = prod.fechaVencimiento ? prod.fechaVencimiento : "No registrada";

    const tarjeta = document.createElement("div");
    tarjeta.className = "card";
    tarjeta.innerHTML = `
      <img src="${prod.imagen}" alt="${prod.nombre}">
      <div class="card-body">
        <span class="badge">${prod.categoria}</span>
        <h3>${prod.nombre}</h3>
        <p class="precio">Bs. ${prod.precio}</p>
        <p class="stock">Stock disponible: <strong>${stockActual}</strong></p>
        <p class="vencimiento">Vence: <strong>${vencimientoTexto}</strong></p>
        <div class="compra-box">
          <input
            type="number"
            id="cant-${prod.id}"
            class="cantidad-input"
            min="1"
            max="${stockActual}"
            value="1"
            ${agotado ? "disabled" : ""}
          >
          <button
            class="btn-comprar"
            ${agotado ? "disabled" : ""}
            onclick="comprar('${prod.id}')"
          >
            ${agotado ? "Sin stock" : "Comprar"}
          </button>
        </div>
      </div>
    `;
    catalogo.appendChild(tarjeta);
  });
}

// Cliente compra - resta stock en mockapi y registra venta
async function comprar(id) {
  const prod = productos.find(p => p.id === id);
  if (!prod) return;

  const inputCant = document.getElementById(`cant-${id}`);
  const cantidad = Number(inputCant.value);
  const stockActual = Number(prod.stock);

  if (cantidad <= 0 || cantidad > stockActual) {
    alert("Cantidad no válida o mayor al stock disponible.");
    return;
  }

  const nuevoStock = stockActual - cantidad;

  try {
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: nuevoStock })
    });

    const subtotal = cantidad * Number(prod.precio);
    ventasRealizadas.unshift(`${cantidad}x ${prod.nombre} — Bs. ${subtotal}`);
    ingresosTotales += subtotal;
    actualizarResumenVentas();

    await cargarProductos();
    alert(`¡Compra realizada! Se descontaron ${cantidad} unidad(es) de "${prod.nombre}".`);
  } catch (error) {
    console.error("Error al procesar la compra:", error);
  }
}

function actualizarResumenVentas() {
  totalVentasSpan.textContent = ventasRealizadas.length;
  totalIngresosSpan.textContent = `Bs. ${ingresosTotales}`;
  listaVentasUl.innerHTML = "";

  ventasRealizadas.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    listaVentasUl.appendChild(li);
  });
}

// Filtros
document.querySelectorAll(".btn-filtro").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".btn-filtro.activo").classList.remove("activo");
    btn.classList.add("activo");
    categoriaSeleccionada = btn.dataset.categoria;
    dibujarCatalogo();
  });
});

// Login desde "Administrar ventas"
btnAdministrarVentas.addEventListener("click", () => {
  modalLogin.classList.remove("oculto");
  mensajeErrorLogin.classList.add("oculto");
});

cerrarModal.addEventListener("click", () => {
  modalLogin.classList.add("oculto");
});

formLogin.addEventListener("submit", (e) => {
  e.preventDefault();
  const usuario = document.getElementById("usuarioLogin").value.trim();
  const clave = document.getElementById("claveLogin").value.trim();

  if (usuario === ADMIN_USER && clave === ADMIN_PASS) {
    modalLogin.classList.add("oculto");
    panelAdmin.classList.remove("oculto");
    btnAdministrarVentas.classList.add("oculto");
    btnSalirAdmin.classList.remove("oculto");
    formLogin.reset();
  } else {
    mensajeErrorLogin.classList.remove("oculto");
  }
});

btnSalirAdmin.addEventListener("click", () => {
  panelAdmin.classList.add("oculto");
  btnAdministrarVentas.classList.remove("oculto");
  btnSalirAdmin.classList.add("oculto");
});

// crud
formProducto.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("productoId").value;
  const datos = {
    nombre: document.getElementById("nombre").value.trim(),
    precio: Number(document.getElementById("precio").value),
    stock: Number(document.getElementById("stock").value),
    categoria: document.getElementById("categoria").value,
    fechaVencimiento: document.getElementById("fechaVencimiento").value,
    imagen: document.getElementById("imagen").value.trim()
  };

  try {
    if (id) {
      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });
    } else {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });
    }

    resetearFormulario();
    await cargarProductos();
  } catch (error) {
    console.error("Error al guardar en CRUD:", error);
  }
});

function dibujarTablaAdmin() {
  tablaAdminBody.innerHTML = "";

  productos.forEach(prod => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${prod.nombre}</td>
      <td>${prod.categoria}</td>
      <td>Bs. ${prod.precio}</td>
      <td>${prod.stock}</td>
      <td>${prod.fechaVencimiento ? prod.fechaVencimiento : "—"}</td>
      <td>
        <button class="btn-editar" onclick="editarProducto('${prod.id}')">Editar</button>
        <button class="btn-eliminar" onclick="eliminarProducto('${prod.id}')">Eliminar</button>
      </td>
    `;
    tablaAdminBody.appendChild(fila);
  });
}

function editarProducto(id) {
  const prod = productos.find(p => p.id === id);
  if (!prod) return;

  document.getElementById("productoId").value = prod.id;
  document.getElementById("nombre").value = prod.nombre;
  document.getElementById("precio").value = prod.precio;
  document.getElementById("stock").value = prod.stock;
  document.getElementById("categoria").value = prod.categoria;
  document.getElementById("fechaVencimiento").value = prod.fechaVencimiento || "";
  document.getElementById("imagen").value = prod.imagen;

  btnGuardar.textContent = "Actualizar Producto";
  btnCancelar.classList.remove("oculto");
}

btnCancelar.addEventListener("click", resetearFormulario);

function resetearFormulario() {
  formProducto.reset();
  document.getElementById("productoId").value = "";
  btnGuardar.textContent = "Guardar Producto";
  btnCancelar.classList.add("oculto");
}

// crud eliminar
async function eliminarProducto(id) {
  if (!confirm("¿Eliminar este producto del catálogo?")) return;

  try {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    await cargarProductos();
  } catch (error) {
    console.error("Error al eliminar producto:", error);
  }
}