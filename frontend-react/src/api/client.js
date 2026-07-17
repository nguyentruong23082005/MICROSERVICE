const viteEnv = import.meta.env || {};

export const GATEWAY_BASE_URL = viteEnv.VITE_GATEWAY_BASE_URL || 'http://localhost:8900';
export const API_BASE = viteEnv.VITE_API_BASE || `${GATEWAY_BASE_URL}/api`;
export const RECOMMENDATION_SERVICE_BASE_URL = viteEnv.VITE_RECOMMENDATION_SERVICE_BASE_URL || 'http://localhost:8814';

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

const STORAGE_KEYS = Object.freeze({
  customer: Object.freeze(['rf_userId', 'rf_userName', 'rf_role']),
  admin: Object.freeze(['rf_admin_userId', 'rf_admin_userName', 'rf_admin_role']),
});

function clearAuthStorage(scope) {
  if (typeof localStorage === 'undefined') return;
  STORAGE_KEYS[scope].forEach((key) => localStorage.removeItem(key));
}

function normalizeAuthScope(authScope) {
  return authScope === 'admin' ? 'admin' : 'customer';
}

function buildHeaders(options = {}) {
  const hasBody = options.body !== undefined && !(options.body instanceof FormData);
  const method = (options.method || 'GET').toUpperCase();
  const scope = normalizeAuthScope(options.authScope);
  const csrfCookie = scope === 'admin' ? 'XSRF-ADMIN-TOKEN' : 'XSRF-TOKEN';
  const csrfToken = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    ? readCookie(csrfCookie)
    : null;

  return {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    'X-Auth-Scope': scope,
    ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
    ...options.headers,
  };
}

async function normalizeResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const rawBody = await response.text();
  if (rawBody.trim().length === 0) return null;

  return contentType.includes('application/json') ? JSON.parse(rawBody) : rawBody;
}

export async function request(path, options = {}) {
  const { authScope, ...fetchOptions } = options;
  const scope = normalizeAuthScope(authScope);
  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    credentials: 'include',
    headers: buildHeaders(options),
  });

  const body = await normalizeResponse(response);

  const sessionRejected = response.status === 401 || (scope === 'admin' && response.status === 403);
  if (sessionRejected) {
    clearAuthStorage(scope);
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { scope } }));
    }
  }

  if (!response.ok) {
    const error = new Error(
      typeof body === 'string' ? body : body?.message || `${response.status} ${response.statusText}`
    );
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

export const get = (path, options = {}) => request(path, { ...options, method: 'GET' });
export const post = (path, data, options = {}) => request(path, {
  ...options,
  method: 'POST',
  ...(data === undefined ? {} : { body: JSON.stringify(data) }),
});
export const put = (path, data, options = {}) => request(path, {
  ...options,
  method: 'PUT',
  ...(data === undefined ? {} : { body: JSON.stringify(data) }),
});
export const patch = (path, data, options = {}) => request(path, {
  ...options,
  method: 'PATCH',
  ...(data === undefined ? {} : { body: JSON.stringify(data) }),
});
export const del = (path, options = {}) => request(path, { ...options, method: 'DELETE' });

export default request;
