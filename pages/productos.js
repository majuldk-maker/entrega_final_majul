// productos.js
// Carrito para la página productos.html
const PRODUCTS_URL = './products.json';
const LOCALSTORAGE_KEY = 'proyecto_carrito_v1';

// DOM
const productsContainer = document.getElementById('products-container');
const cartCountEl = document.getElementById('cart-count');
const openCartBtn = document.getElementById('open-cart-btn');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');

let products = [];
let cart = [];

// ---------- UTIL ----------
const formatCurrency = (num) => Number(num).toLocaleString('es-AR');

const saveCart = () => {
  localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(cart));
};

const loadCart = () => {
  const raw = localStorage.getItem(LOCALSTORAGE_KEY);
  cart = raw ? JSON.parse(raw) : [];
};

// ---------- FETCH DATOS ----------
async function loadProducts() {
  try {
    const res = await fetch(PRODUCTS_URL);
    if (!res.ok) throw new Error('No se pudo cargar products.json');
    products = await res.json();
    renderProducts();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los productos. Revisa products.json',
    });
    console.error(error);
  }
}

// ---------- RENDER PRODUCTOS ----------
function renderProducts() {
  productsContainer.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.title}">
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <p><strong>$${formatCurrency(p.price)}</strong></p>
      <p>Stock: ${p.stock}</p>
      <div>
        <button data-id="${p.id}" class="add-to-cart-btn">Agregar</button>
      </div>
    `;
    productsContainer.appendChild(card);
  });

  // Delegación de eventos
  productsContainer.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      addToCart(id);
    });
  });
}

// ---------- LÓGICA DEL CARRITO ----------
function addToCart(productId, qty = 1) {
  const product = products.find(p => p.id === productId);
  if (!product) {
    Swal.fire('Error', 'Producto no encontrado', 'error');
    return;
  }

  const item = cart.find(ci => ci.id === productId);
  if (item) {
    if (item.quantity + qty > product.stock) {
      Swal.fire('Sin stock', 'No hay suficiente stock para esa cantidad', 'warning');
      return;
    }
    item.quantity += qty;
  } else {
    if (qty > product.stock) {
      Swal.fire('Sin stock', 'No hay suficiente stock para esa cantidad', 'warning');
      return;
    }
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: qty
    });
  }

  saveCart();
  updateCartUI();
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: `${product.title} agregado al carrito`,
    timer: 1400,
    showConfirmButton: false
  });
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
}

function changeQuantity(productId, newQty) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  const product = products.find(p => p.id === productId);
  if (newQty <= 0) {
    removeFromCart(productId);
    return;
  }
  if (newQty > product.stock) {
    Swal.fire('Sin stock', 'No hay suficiente stock para esa cantidad', 'warning');
    return;
  }
  item.quantity = newQty;
  saveCart();
  updateCartUI();
}

function getCartCount() {
  return cart.reduce((acc, item) => acc + item.quantity, 0);
}

function getCartTotal() {
  return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

// ---------- RENDER CARRITO ----------
function renderCartItems() {
  cartItemsEl.innerHTML = '';
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p>El carrito está vacío.</p>';
    cartTotalEl.textContent = '0';
    return;
  }

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <p>$${formatCurrency(item.price)} x ${item.quantity}</p>
      </div>
      <div>
        <input type="number" min="1" value="${item.quantity}" data-id="${item.id}" class="qty-input" style="width:60px" />
        <button data-id="${item.id}" class="remove-btn">Eliminar</button>
      </div>
    `;
    cartItemsEl.appendChild(row);
  });

  // eventos dentro del carrito
  cartItemsEl.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      const newQty = Number(e.target.value);
      changeQuantity(id, newQty);
    });
  });

  cartItemsEl.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id);
      Swal.fire({
        title: '¿Eliminar producto?',
        text: 'Se quitará del carrito',
        icon: 'question',
        showCancelButton: true
      }).then(result => {
        if (result.isConfirmed) removeFromCart(id);
      });
    });
  });

  cartTotalEl.textContent = formatCurrency(getCartTotal());
}

function updateCartUI() {
  cartCountEl.textContent = getCartCount();
  renderCartItems();
}

// ---------- EVENTOS UI ----------
openCartBtn.addEventListener('click', () => {
  cartModal.classList.remove('hidden');
  updateCartUI();
});
closeCartBtn.addEventListener('click', () => cartModal.classList.add('hidden'));

clearCartBtn.addEventListener('click', () => {
  if (cart.length === 0) {
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
      cart = [];
      saveCart();
      updateCartUI();
      Swal.fire('Carrito vaciado', '', 'success');
    }
  });
});

checkoutBtn.addEventListener('click', async () => {
  if (cart.length === 0) {
    Swal.fire('No hay items en el carrito', '', 'info');
    return;
  }

  // Formulario precargado con SweetAlert2
  const { value: formValues } = await Swal.fire({
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

  if (!formValues) return;

  const confirmation = await Swal.fire({
    title: 'Confirmar compra',
    html: `<p>Total a pagar: <strong>$${formatCurrency(getCartTotal())}</strong></p>
           <p>Nombre: ${formValues.name}</p>
           <p>Email: ${formValues.email}</p>`,
    showCancelButton: true,
    confirmButtonText: 'Pagar (simulado)'
  });

  if (confirmation.isConfirmed) {
    Swal.fire({
      title: 'Procesando pago...',
      didOpen: () => Swal.showLoading(),
      timer: 1000
    }).then(() => {
      // Reducir stock localmente (simulación)
      cart.forEach(ci => {
        const prod = products.find(p => p.id === ci.id);
        if (prod) prod.stock = Math.max(0, prod.stock - ci.quantity);
      });

      cart = [];
      saveCart();
      updateCartUI();
      renderProducts();
      Swal.fire('Compra exitosa', '¡Gracias por tu compra! (simulado)', 'success');
    });
  }
});

// ---------- INIT ----------
function init() {
  loadCart();
  loadProducts();
  updateCartUI();
}

init();
