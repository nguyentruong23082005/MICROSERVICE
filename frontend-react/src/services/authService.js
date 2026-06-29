import { post, get } from './api.js';

const AUTH_PREFIX = '/accounts/auth';

/** POST /api/accounts/auth/login */
export async function login(userName, password) {
  const data = await post(`${AUTH_PREFIX}/login`, { userName, password });
  // Lưu token + thông tin vào localStorage
  localStorage.setItem('rf_token', data.token);
  localStorage.setItem('rf_userId', data.userId);
  localStorage.setItem('rf_userName', data.userName);
  localStorage.setItem('rf_role', data.role || 'ROLE_USER');
  return data;
}

/** POST /api/accounts/auth/registration */
export async function register(payload) {
  return post(`${AUTH_PREFIX}/registration`, payload);
}

/** Đăng xuất — gửi yêu cầu blacklist lên server và xóa localStorage */
export async function logout() {
  const token = localStorage.getItem('rf_token');
  const userId = localStorage.getItem('rf_userId');
  if (token && userId) {
    try {
      await post(`${AUTH_PREFIX}/logout?userId=${userId}`);
    } catch (e) {
      console.error('Failed to logout on server:', e);
    }
  }
  ['rf_token', 'rf_userId', 'rf_userName', 'rf_role'].forEach(k =>
    localStorage.removeItem(k)
  );
}

/** Lấy thông tin user hiện tại từ localStorage */
export function getCurrentUser() {
  const token = localStorage.getItem('rf_token');
  if (!token) return null;
  return {
    token,
    userId: localStorage.getItem('rf_userId'),
    userName: localStorage.getItem('rf_userName'),
    role: localStorage.getItem('rf_role') || 'ROLE_USER',
  };
}

export function isAdmin() {
  return localStorage.getItem('rf_role') === 'ROLE_ADMIN';
}
