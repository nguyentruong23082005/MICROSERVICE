const API_BASE = 'http://localhost:8900/api';

const state = {
  products: [],
  cart: [],
  token: localStorage.getItem('rf_token') || '',
  role: localStorage.getItem('rf_role') || '',
};

const els = {
  gatewayStatus: document.getElementById('gatewayStatus'),
  healthBtn: document.getElementById('healthBtn'),
  loginForm: document.getElementById('loginForm'),
  loginOutput: document.getElementById('loginOutput'),
  productGrid: document.getElementById('productGrid'),
  refreshProductsBtn: document.getElementById('refreshProductsBtn'),
  searchInput: document.getElementById('searchInput'),
  categoryFilter: document.getElementById('categoryFilter'),
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  checkoutUserId: document.getElementById('checkoutUserId'),
  checkoutOutput: document.getElementById('checkoutOutput'),
  loadPaymentsBtn: document.getElementById('loadPaymentsBtn'),
  loadNotificationsBtn: document.getElementById('loadNotificationsBtn'),
  paymentsOutput: document.getElementById('paymentsOutput'),
  notificationsOutput: document.getElementById('notificationsOutput'),
};

function headers(extra = {}) {
  return {
    'Content-Type': 'application/json',
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...extra,
  };
}

function money(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

function showJson(element, value) {
  element.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: headers(options.headers) });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function checkHealth() {
  try {
    const response = await fetch('http://localhost:8900/actuator/health');
    els.gatewayStatus.textContent = response.ok ? 'Gateway đang chạy' : `Gateway status ${response.status}`;
  } catch (error) {
    els.gatewayStatus.textContent = `Gateway chưa chạy: ${error.message}`;
  }
}

async function login(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    const data = await request('/accounts/login', {
      method: 'POST',
      body: JSON.stringify({ userName: form.get('userName'), password: form.get('password') }),
    });
    state.token = data.token;
    state.role = data.role || '';
    localStorage.setItem('rf_token', data.token);
    localStorage.setItem('rf_role', state.role);
    els.checkoutUserId.value = data.userId || '';
    showJson(els.loginOutput, data);
  } catch (error) {
    showJson(els.loginOutput, error.message);
  }
}

async function loadProducts() {
  try {
    state.products = await request('/catalog/products');
    syncCategories();
    renderProducts();
  } catch (error) {
    els.productGrid.innerHTML = `<article class="panel empty-state"><h2>Không tải được sản phẩm</h2><p class="muted">${escapeHtml(error.message)}</p></article>`;
  }
}

function syncCategories() {
  const selected = els.categoryFilter.value;
  const categories = [...new Set(state.products.map(product => product.category).filter(Boolean))];
  els.categoryFilter.innerHTML = '<option value="">Tất cả category</option>' + categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  els.categoryFilter.value = selected;
}

function filteredProducts() {
  const search = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  return state.products.filter(product => {
    const matchesSearch = !search || product.productName?.toLowerCase().includes(search);
    const matchesCategory = !category || product.category === category;
    return matchesSearch && matchesCategory;
  });
}

function imageMarkup(product) {
  if (product.imageUrl) {
    return `<img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.productName)}">`;
  }
  return '<div class="no-image" aria-label="Không có ảnh">NO IMAGE</div>';
}

function renderProducts() {
  const products = filteredProducts();
  if (!products.length) {
    els.productGrid.innerHTML = '<article class="panel empty-state"><h2>Chưa có sản phẩm thật</h2><p class="muted">Vào trang Admin để nhập sản phẩm thật, sau đó quay lại tải catalog.</p><a class="primary-btn" href="admin.html">Mở Admin</a></article>';
    return;
  }
  els.productGrid.innerHTML = products.map(product => `
    <article class="product-card">
      ${imageMarkup(product)}
      <div class="product-body">
        <div class="product-meta"><span>${escapeHtml(product.category || 'Chưa phân loại')}</span><span>Còn ${Number(product.availability || 0)}</span></div>
        <h3>${escapeHtml(product.productName)}</h3>
        <p class="muted">${escapeHtml(product.discription || '')}</p>
        <div class="product-meta"><strong class="price">${money(product.price)}</strong><button class="primary-btn small" data-add="${product.id}">Thêm</button></div>
      </div>
    </article>`).join('');
}

function addToCart(productId) {
  const product = state.products.find(item => Number(item.id) === Number(productId));
  if (!product) return;
  const existing = state.cart.find(item => Number(item.id) === Number(productId));
  state.cart = existing
    ? state.cart.map(item => Number(item.id) === Number(productId) ? { ...item, quantity: item.quantity + 1 } : item)
    : [...state.cart, { ...product, quantity: 1 }];
  renderCart();
}

function renderCart() {
  if (!state.cart.length) {
    els.cartItems.innerHTML = '<p class="muted">Giỏ hàng trống.</p>';
  } else {
    els.cartItems.innerHTML = state.cart.map(item => `
      <div class="cart-row"><span>${escapeHtml(item.productName)} × ${item.quantity}</span><strong>${money(Number(item.price) * item.quantity)}</strong></div>`).join('');
  }
  const total = state.cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  els.cartTotal.textContent = money(total);
}

async function checkout() {
  const userId = els.checkoutUserId.value || '1';
  showJson(els.checkoutOutput, 'Checkout thật cần cart Redis Cookie từ order-service. UI này giữ logic cũ và chỉ hiển thị preview giỏ hàng.');
  if (!state.cart.length) return;
  showJson(els.checkoutOutput, { userId, cartPreview: state.cart, note: 'Use backend cart API for persisted Redis cart before checkout.' });
}

async function loadPayments() {
  try { showJson(els.paymentsOutput, await request('/payments/payments')); }
  catch (error) { showJson(els.paymentsOutput, error.message); }
}

async function loadNotifications() {
  try { showJson(els.notificationsOutput, await request('/notifications/notifications')); }
  catch (error) { showJson(els.notificationsOutput, error.message); }
}

els.healthBtn.addEventListener('click', checkHealth);
els.loginForm.addEventListener('submit', login);
els.refreshProductsBtn.addEventListener('click', loadProducts);
els.searchInput.addEventListener('input', renderProducts);
els.categoryFilter.addEventListener('change', renderProducts);
els.productGrid.addEventListener('click', event => {
  const button = event.target.closest('[data-add]');
  if (button) addToCart(button.dataset.add);
});
els.checkoutBtn.addEventListener('click', checkout);
els.loadPaymentsBtn.addEventListener('click', loadPayments);
els.loadNotificationsBtn.addEventListener('click', loadNotifications);

renderCart();
checkHealth();
loadProducts();
