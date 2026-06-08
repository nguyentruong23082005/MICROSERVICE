const API_BASE = 'http://localhost:8900/api';

const state = {
  token: localStorage.getItem('rf_token') || '',
  role: localStorage.getItem('rf_role') || '',
  products: [],
  payments: [],
  notifications: [],
};

const els = {
  tokenInput: document.getElementById('adminTokenInput'),
  saveTokenBtn: document.getElementById('saveTokenBtn'),
  refreshBtn: document.getElementById('adminRefreshBtn'),
  productCount: document.getElementById('productCount'),
  stockCount: document.getElementById('stockCount'),
  paymentCount: document.getElementById('paymentCount'),
  notificationCount: document.getElementById('notificationCount'),
  productForm: document.getElementById('productForm'),
  productActionOutput: document.getElementById('productActionOutput'),
  productList: document.getElementById('adminProductList'),
  paymentsOutput: document.getElementById('adminPaymentsOutput'),
  notificationsOutput: document.getElementById('adminNotificationsOutput'),
};

function authHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...extra,
  };
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

function showJson(element, value) {
  element.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function money(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));
}

function isAdmin() {
  return state.role === 'ROLE_ADMIN' || state.role === 'ADMIN';
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: authHeaders(options.headers) });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  return body;
}

function updateAdminState() {
  const message = state.token
    ? `Token đã lưu. Role hiện tại: ${state.role || 'chưa biết'}.`
    : 'Chưa có token. Hãy login admin ở storefront hoặc dán JWT admin.';
  showJson(els.productActionOutput, isAdmin() ? `${message} Có quyền quản trị.` : `${message} Chưa có quyền ROLE_ADMIN.`);
}

function updateMetrics() {
  els.productCount.textContent = state.products.length;
  els.stockCount.textContent = state.products.reduce((sum, product) => sum + Number(product.availability || 0), 0);
  els.paymentCount.textContent = state.payments.length;
  els.notificationCount.textContent = state.notifications.length;
}

function imageMarkup(product) {
  if (product.imageUrl) {
    return `<img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.productName)}">`;
  }
  return '<div class="admin-no-image" aria-label="Không có ảnh">NO IMAGE</div>';
}

function renderProducts() {
  if (!state.products.length) {
    els.productList.innerHTML = '<article class="empty-state compact"><h3>Chưa có sản phẩm</h3><p class="muted">Hãy thêm sản phẩm thật bằng form bên trái.</p></article>';
    return;
  }

  els.productList.innerHTML = state.products.map(product => `
    <article class="admin-row">
      ${imageMarkup(product)}
      <div>
        <strong>${escapeHtml(product.productName)}</strong>
        <p class="muted">${escapeHtml(product.category || 'Chưa phân loại')} · ${money(product.price)} · Stock ${Number(product.availability || 0)}</p>
      </div>
      <button class="ghost-btn small" data-delete-product="${product.id}" ${isAdmin() ? '' : 'disabled'}>Xóa</button>
    </article>`).join('');
}

async function loadProducts() {
  state.products = await request('/catalog/products');
  renderProducts();
  updateMetrics();
}

async function loadPayments() {
  try {
    state.payments = await request('/payments/payments');
    showJson(els.paymentsOutput, state.payments);
  } catch (error) {
    state.payments = [];
    showJson(els.paymentsOutput, error.message);
  }
  updateMetrics();
}

async function loadNotifications() {
  try {
    state.notifications = await request('/notifications/notifications');
    showJson(els.notificationsOutput, state.notifications);
  } catch (error) {
    state.notifications = [];
    showJson(els.notificationsOutput, error.message);
  }
  updateMetrics();
}

async function refreshAll() {
  try {
    await loadProducts();
  } catch (error) {
    els.productList.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
  }
  await Promise.all([loadPayments(), loadNotifications()]);
  updateAdminState();
}

async function createProduct(event) {
  event.preventDefault();
  if (!isAdmin()) {
    showJson(els.productActionOutput, 'Bạn cần login bằng tài khoản ROLE_ADMIN để tạo sản phẩm.');
    return;
  }
  const form = new FormData(event.currentTarget);
  const product = {
    productName: form.get('productName'),
    category: form.get('category'),
    price: Number(form.get('price')),
    availability: Number(form.get('availability')),
    imageUrl: form.get('imageUrl'),
    discription: form.get('discription'),
  };

  try {
    const created = await request('/catalog/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    showJson(els.productActionOutput, created);
    event.currentTarget.reset();
    await loadProducts();
  } catch (error) {
    showJson(els.productActionOutput, error.message);
  }
}

async function deleteProduct(productId) {
  if (!isAdmin()) {
    showJson(els.productActionOutput, 'Bạn cần ROLE_ADMIN để xóa sản phẩm.');
    return;
  }
  try {
    await request(`/catalog/admin/products/${productId}`, { method: 'DELETE' });
    showJson(els.productActionOutput, `Đã xóa product #${productId}`);
    await loadProducts();
  } catch (error) {
    showJson(els.productActionOutput, error.message);
  }
}

function saveToken() {
  state.token = els.tokenInput.value.trim();
  localStorage.setItem('rf_token', state.token);
  showJson(els.productActionOutput, state.token ? 'Đã lưu token. Hãy login từ storefront để tự lưu role, hoặc đảm bảo token này có ROLE_ADMIN.' : 'Đã xóa token.');
}

els.tokenInput.value = state.token;
els.saveTokenBtn.addEventListener('click', saveToken);
els.refreshBtn.addEventListener('click', refreshAll);
els.productForm.addEventListener('submit', createProduct);
els.productList.addEventListener('click', event => {
  const button = event.target.closest('[data-delete-product]');
  if (button) deleteProduct(button.dataset.deleteProduct);
});

refreshAll();
