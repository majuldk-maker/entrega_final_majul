
const JSON_URL = './productos.json';
const LOCALSTORAGE_KEY = 'proyecto_carrito_v1';


const contenedorProductos = document.getElementById('contenedor-productos');
const contadorCarrito = document.getElementById('contador-carrito');
const btnAbrirCarrito = document.getElementById('btn-abrir-carrito');
const modalCarrito = document.getElementById('modal-carrito');
const btnCerrarCarrito = document.getElementById('btn-cerrar-carrito');
const itemsCarrito = document.getElementById('items-carrito');
const carritoTotal = document.getElementById('carrito-total');
const btnCheckout = document.getElementById('btn-checkout');
const btnBorrarCarrito = document.getElementById('btn-borrar-carrito');

let productos = [];
let carrito = [];


const formatearMoneda = (num) => Number(num).toLocaleString('es-AR');

const guardarCarrito = () => {
  localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(carrito));
};

const cargarCarrito = () => {
  const raw = localStorage.getItem(LOCALSTORAGE_KEY);
  carrito = raw ? JSON.parse(raw) : [];
};


async function cargarProductos() {
  try {
    const res = await fetch(JSON_URL);
    if (!res.ok) throw new Error('No se pudo cargar productos.json');
    productos = await res.json();
    renderProductos();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los productos. Revisa productos.json',
    });
    console.error(error);
  }
}


function renderProductos() {
  contenedorProductos.innerHTML = '';
  productos.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.titulo}">
      <h3>${p.titulo}</h3>
      <p>${p.descripcion}</p>
      <p><strong>$${formatearMoneda(p.precio)}</strong></p>
      <p>Stock: ${p.stock}</p>
      <div>
        <button data-id="${p.id}" class="btn-agregar-carrito">Agregar</button>
      </div>
    `;
    contenedorProductos.appendChild(card);
  });

  contenedorProductos.querySelectorAll('.btn-agregar-carrito').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      addToCart(id);
    });
  });
}

function addToCart(idProducto, cant = 1) {
  const product = productos.find(p => p.id === idProducto);
  if (!product) {
    Swal.fire('Error', 'Producto no encontrado', 'error');
    return;
  }

  const item = carrito.find(ci => ci.id === idProducto);
  if (item) {
    if (item.cantidad + cant > product.stock) {
      Swal.fire('Sin stock', 'No hay suficiente stock para esa cantidad', 'warning');
      return;
    }
    item.cantidad += cant;
  } else {
    if (cant > product.stock) {
      Swal.fire('Sin stock', 'No hay suficiente stock para esa cantidad', 'warning');
      return;
    }
    carrito.push({
      id: product.id,
      titulo: product.titulo,
      precio: product.precio,
      cantidad: cant
    });
  }

  guardarCarrito();
  actualizarUICarrito();
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: `${product.titulo} agregado al carrito`,
    timer: 1400,
    showConfirmButton: false
  });
}

function borrarItemCarrito(idProducto) {
  carrito = carrito.filter(i => i.id !== idProducto);
  guardarCarrito();
  actualizarUICarrito();
}

function cambiarCantidad(idProducto, nuevaCant) {
  const item = carrito.find(i => i.id === idProducto);
  if (!item) return;
  const product = productos.find(p => p.id === idProducto);
  if (nuevaCant <= 0) {
    borrarItemCarrito(idProducto);
    return;
  }
  if (nuevaCant > product.stock) {
    Swal.fire('Sin stock', 'No hay suficiente stock para esa cantidad', 'warning');
    return;
  }
  item.cantidad = nuevaCant;
  guardarCarrito();
  actualizarUICarrito();
}

function getContadorCarrito() {
  return carrito.reduce((acc, item) => acc + item.cantidad, 0);
}

function getTotalCarrito() {
  return carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
}

function renderCarritoItems() {
  itemsCarrito.innerHTML = '';
  if (carrito.length === 0) {
    itemsCarrito.innerHTML = '<p>El carrito está vacío.</p>';
    carritoTotal.textContent = '0';
    return;
  }

  carrito.forEach(item => {
    const row = document.createElement('div');
    row.className = 'carrito-row';
    row.innerHTML = `
      <div>
        <strong>${item.titulo}</strong>
        <p>$${formatearMoneda(item.precio)} x ${item.cantidad}</p>
      </div>
      <div>
        <input type="number" min="1" value="${item.cantidad}" data-id="${item.id}" class="cant-input" style="width:60px" />
        <button data-id="${item.id}" class="remove-btn">Eliminar</button>
      </div>
    `;
    itemsCarrito.appendChild(row);
  });

  itemsCarrito.querySelectorAll('.cant-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      const nuevaCant = Number(e.target.value);
      cambiarCantidad(id, nuevaCant);
    });
  });

  itemsCarrito.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      Swal.fire({
        title: '¿Eliminar producto?',
        text: 'Se quitará del carrito',
        icon: 'question',
        showCancelButton: true
      }).then(result => {
        if (result.isConfirmed) borrarItemCarrito(id);
      });
    });
  });

  carritoTotal.textContent = formatearMoneda(getTotalCarrito());
}

function actualizarUICarrito() {
  contadorCarrito.textContent = getContadorCarrito();
  renderCarritoItems();
}


btnAbrirCarrito.addEventListener('click', () => {
  modalCarrito.classList.remove('hidden');
  actualizarUICarrito();
});
btnCerrarCarrito.addEventListener('click', () => modalCarrito.classList.add('hidden'));

btnBorrarCarrito.addEventListener('click', () => {
  if (carrito.length === 0) {
    Swal.fire('Carrito vacío', '', 'info');
    return;
  }
  Swal.fire({
    title: 'Vaciar carrito?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, vaciar'
  }).then(res => {
    if (res.isConfirmed) {
      carrito = [];
      guardarCarrito();
      actualizarUICarrito();
      Swal.fire('Carrito vaciado', '', 'success');
    }
  });
});

btnCheckout.addEventListener('click', async () => {
  if (carrito.length === 0) {
    Swal.fire('No hay items en el carrito', '', 'info');
    return;
  }


  const { value: formData } = await Swal.fire({
    title: 'Completa tus datos',
    html:
      `<input id="swal-input1" class="swal2-input" placeholder="Nombre" value="Daiana Majul">` +
      `<input id="swal-input2" class="swal2-input" placeholder="Email" value="dayito@example.com">` +
      `<input id="swal-input3" class="swal2-input" placeholder="Dirección" value="Calle Falsa 123">`,
    focusConfirm: false,
    preConfirm: () => {
      return {
        name: document.getElementById('swal-input1').value,
        email: document.getElementById('swal-input2').value,
        address: document.getElementById('swal-input3').value
      };
    }
  });

  if (!formData) return;

  const confirmacion = await Swal.fire({
    title: 'Confirmar compra',
    html: `<p>Total a pagar: <strong>$${formatearMoneda(getTotalCarrito())}</strong></p>
           <p>Nombre: ${formData.name}</p>
           <p>Email: ${formData.email}</p>`,
    showCancelButton: true,
    confirmButtonText: 'Pagar (simulado)'
  });

  if (confirmacion.isConfirmed) {
    Swal.fire({
      title: 'Procesando pago...',
      didOpen: () => Swal.showLoading(),
      timer: 1000
    }).then(() => {
      // Reducir stock localmente (simulación)
      carrito.forEach(ci => {
        const prod = productos.find(p => p.id === ci.id);
        if (prod) prod.stock = Math.max(0, prod.stock - ci.cantidad);
      });

      carrito = [];
      guardarCarrito();
      actualizarUICarrito();
      renderProductos();
      Swal.fire('Compra exitosa', '¡Gracias por tu compra! (simulado)', 'success');
    });
  }
});


function init() {
  cargarCarrito();
  cargarProductos();
  actualizarUICarrito();
}

init();
