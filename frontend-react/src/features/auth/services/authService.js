import { get, post } from '../../../api/client.js';

const AUTH_PREFIX = '/accounts/auth';

/* ---------- Key helpers ---------- */
const CUSTOMER_PREFIX = 'rf_';
const ADMIN_PREFIX = 'rf_admin_';

function keysFor(prefix) {
  return {
    token:    `${prefix}token`,
    userId:   `${prefix}userId`,
    userName: `${prefix}userName`,
    role:     `${prefix}role`,
  };
}

const CUSTOMER_KEYS = keysFor(CUSTOMER_PREFIX);
const ADMIN_KEYS = keysFor(ADMIN_PREFIX);

/** Store non-sensitive customer session metadata; auth tokens remain in HttpOnly cookies. */
function storeCustomerSession(data) {
  localStorage.removeItem(CUSTOMER_KEYS.token);
  localStorage.setItem(CUSTOMER_KEYS.userId, data.userId);
  localStorage.setItem(CUSTOMER_KEYS.userName, data.userName);
  localStorage.setItem(CUSTOMER_KEYS.role, data.role || 'ROLE_USER');
  return data;
}

/** POST /api/accounts/auth/login  (customer side) */
export async function login(identifier, password) {
  const data = await post(
    `${AUTH_PREFIX}/login`,
    { userName: identifier, password },
    { authScope: 'customer' },
  );
  return storeCustomerSession(data);
}

/** Exchange a verified Firebase ID token for the application's cookie session. */
export async function firebaseLogin(idToken) {
  const data = await post(
    `${AUTH_PREFIX}/firebase-login`,
    { idToken },
    { authScope: 'customer' },
  );
  return storeCustomerSession(data);
}

/** POST /api/accounts/auth/registration */
export async function register(payload) {
  return post(`${AUTH_PREFIX}/registration`, payload, { authScope: 'customer' });
}

export async function forgotPassword(email) {
  return post(`${AUTH_PREFIX}/forgot-password`, { email }, { authScope: 'customer' });
}

export async function resetPassword(token, newPassword) {
  return post(`${AUTH_PREFIX}/reset-password`, { token, newPassword }, { authScope: 'customer' });
}

/** Đăng xuất customer và xóa metadata phiên phía trình duyệt */
export async function logout() {
  try {
    await post(`${AUTH_PREFIX}/logout`, undefined, { authScope: 'customer' });
  } catch (error) {
    console.error('Failed to logout on server:', error);
  }
  Object.values(CUSTOMER_KEYS).forEach((key) => localStorage.removeItem(key));
}

/** Lấy metadata customer hiện tại */
export function getCurrentUser() {
  const userId = localStorage.getItem(CUSTOMER_KEYS.userId);
  if (!userId) return null;
  return {
    userId,
    userName: localStorage.getItem(CUSTOMER_KEYS.userName),
    role: localStorage.getItem(CUSTOMER_KEYS.role) || 'ROLE_USER',
  };
}

export async function getUserProfile(userId) {
  return get(`/accounts/users/${userId}`, { authScope: 'customer' });
}

export function isAdmin() {
  return localStorage.getItem(CUSTOMER_KEYS.role) === 'ROLE_ADMIN';
}

/* ---------- Admin auth (separate session) ---------- */

export async function adminLogin(identifier, password) {
  const data = await post(
    `${AUTH_PREFIX}/login`,
    { userName: identifier, password },
    { authScope: 'admin' },
  );
  localStorage.removeItem(ADMIN_KEYS.token);
  localStorage.setItem(ADMIN_KEYS.userId, data.userId);
  localStorage.setItem(ADMIN_KEYS.userName, data.userName);
  localStorage.setItem(ADMIN_KEYS.role, data.role || 'ROLE_USER');
  return data;
}

export async function adminLogout() {
  try {
    await post(`${AUTH_PREFIX}/logout`, undefined, { authScope: 'admin' });
  } catch (error) {
    console.error('Failed to admin-logout on server:', error);
  }
  Object.values(ADMIN_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function getCurrentAdmin() {
  const userId = localStorage.getItem(ADMIN_KEYS.userId);
  if (!userId) return null;
  return {
    userId,
    userName: localStorage.getItem(ADMIN_KEYS.userName),
    role: localStorage.getItem(ADMIN_KEYS.role) || 'ROLE_USER',
  };
}
