import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  getLoginDestination,
  getProtectedLoginPath,
  sanitizeInternalDestination,
} from './authNavigation.js';
import { request } from '../../api/client.js';

const SOURCE_ROOT = new URL('../../', import.meta.url);

test('sanitizeInternalDestination accepts local application paths only', () => {
  assert.equal(sanitizeInternalDestination('/checkout?step=payment'), '/checkout?step=payment');
  assert.equal(sanitizeInternalDestination('https://evil.example/steal'), null);
  assert.equal(sanitizeInternalDestination('//evil.example/steal'), null);
  assert.equal(sanitizeInternalDestination('javascript:alert(1)'), null);
  assert.equal(sanitizeInternalDestination(undefined), null);
});

test('getLoginDestination sends admins to the dashboard by default', () => {
  assert.equal(getLoginDestination({ role: 'ROLE_ADMIN' }), '/admin');
  assert.equal(getLoginDestination({ role: 'ROLE_USER' }), '/');
});

test('getLoginDestination preserves safe destinations compatible with the role', () => {
  assert.equal(getLoginDestination({ role: 'ROLE_USER', requestedPath: '/checkout' }), '/checkout');
  assert.equal(getLoginDestination({ role: 'ROLE_ADMIN', requestedPath: '/admin/orders' }), '/admin/orders');
  assert.equal(getLoginDestination({ role: 'ROLE_USER', requestedPath: '/admin/users' }), '/');
});

test('protected route types use separate customer and admin login entries', () => {
  assert.equal(getProtectedLoginPath('customer'), '/login');
  assert.equal(getProtectedLoginPath('admin'), '/admin/login');
});

test('application routes and guards expose a dedicated admin login contract', async () => {
  const [app, adminRoute, protectedRoute] = await Promise.all([
    readFile(new URL('App.jsx', SOURCE_ROOT), 'utf8'),
    readFile(new URL('components/navigation/AdminRoute.jsx', SOURCE_ROOT), 'utf8'),
    readFile(new URL('components/navigation/ProtectedRoute.jsx', SOURCE_ROOT), 'utf8'),
  ]);

  assert.match(app, /path=["']\/admin\/login["']/);
  assert.match(adminRoute, /to=["']\/admin\/login["']/);
  assert.match(protectedRoute, /to=["']\/login["']/);
});

test('login form labels are associated with their inputs', async () => {
  const loginPage = await readFile(new URL('pages/LoginPage.jsx', SOURCE_ROOT), 'utf8');

  assert.match(loginPage, /<label\s+htmlFor=["']login-username["']/);
  assert.match(loginPage, /<label\s+htmlFor=["']login-password["']/);
});

test('admin login fields opt out of saved credential autofill', async () => {
  const loginPage = await readFile(new URL('pages/LoginPage.jsx', SOURCE_ROOT), 'utf8');

  assert.match(loginPage, /autoComplete=\{adminOnly \? 'one-time-code' : 'username'\}/);
  assert.match(loginPage, /autoComplete=\{adminOnly \? 'new-password' : 'current-password'\}/);
  assert.match(loginPage, /data-1p-ignore=\{adminOnly \? 'true' : undefined\}/);
  assert.match(loginPage, /data-lpignore=\{adminOnly \? 'true' : undefined\}/);
});

test('admin dashboard verifies authorization before loading secondary APIs', async () => {
  const dashboard = await readFile(new URL('features/admin/pages/Dashboard.jsx', SOURCE_ROOT), 'utf8');

  assert.match(dashboard, /const orders = await adminGetOrders\(\);/);
  assert.match(dashboard, /fetchRevenue\(\);[\s\S]*?fetchAdminNotifications\(\);[\s\S]*?adminGetProducts\(\)[\s\S]*?adminGetUsers\(\)/);
});

test('storefront account entry opens the customer modal without admin controls', async () => {
  const [header, footer] = await Promise.all([
    readFile(new URL('components/layout/Header.jsx', SOURCE_ROOT), 'utf8'),
    readFile(new URL('components/layout/Footer.jsx', SOURCE_ROOT), 'utf8'),
  ]);

  assert.match(header, /id=["']login-btn["'][\s\S]*?aria-haspopup=["']dialog["']/);
  assert.match(header, /navigate\(["']\/login["'],\s*\{\s*state:\s*\{\s*backgroundLocation:\s*location/);
  assert.doesNotMatch(header, /admin-entry-btn|auth\.admin_login/);
  assert.doesNotMatch(footer, /href=["']\/admin["']|footer\.admin_login/);
});

test('customer registration sends the backend RegistrationRequest password field', async () => {
  const registerPage = await readFile(new URL('pages/RegisterPage.jsx', SOURCE_ROOT), 'utf8');

  assert.match(registerPage, /userPassword:\s*form\.password/);
  assert.doesNotMatch(registerPage, /\n\s*password:\s*form\.password/);
});

test('customer auth remains isolated from admin storage', async () => {
  const authService = await readFile(new URL('features/auth/services/authService.js', SOURCE_ROOT), 'utf8');

  assert.match(authService, /CUSTOMER_KEYS/);
  assert.match(authService, /ADMIN_KEYS/);
  assert.doesNotMatch(authService, /CUSTOMER_KEYS\.forEach\(\(key\) => localStorage\.removeItem\(key\)\).*adminLogin/s);
  assert.doesNotMatch(authService, /ADMIN_KEYS\.forEach\(\(key\) => localStorage\.removeItem\(key\)\).*return data;/s);
});

function createStorage(entries) {
  const values = new Map(Object.entries(entries));
  return {
    removeItem: (key) => values.delete(key),
    snapshot: () => Object.fromEntries(values),
  };
}

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    statusText: status === 401 ? 'Unauthorized' : 'OK',
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

test('admin mutations send admin scope and admin CSRF token', async () => {
  globalThis.document = { cookie: 'XSRF-TOKEN=customer-csrf; XSRF-ADMIN-TOKEN=admin-csrf' };
  let capturedOptions;
  globalThis.fetch = async (_url, options) => {
    capturedOptions = options;
    return jsonResponse(200, { success: true });
  };

  await request('/catalog/admin/products', {
    method: 'POST',
    body: JSON.stringify({ name: 'Product' }),
    authScope: 'admin',
  });

  assert.equal(capturedOptions.headers['X-Auth-Scope'], 'admin');
  assert.equal(capturedOptions.headers['X-XSRF-TOKEN'], 'admin-csrf');
  assert.equal('authScope' in capturedOptions, false);
});

test('admin unauthorized response clears only admin storage', async () => {
  const storage = createStorage({
    rf_userId: '42', rf_userName: 'customer', rf_role: 'ROLE_USER',
    rf_admin_userId: '7', rf_admin_userName: 'admin', rf_admin_role: 'ROLE_ADMIN',
  });
  globalThis.localStorage = storage;
  globalThis.document = { cookie: '' };
  globalThis.fetch = async () => jsonResponse(401, { message: 'Unauthorized' });

  await assert.rejects(() => request('/accounts/admin/users', { authScope: 'admin' }));

  assert.deepEqual(storage.snapshot(), {
    rf_userId: '42', rf_userName: 'customer', rf_role: 'ROLE_USER',
  });
});

test('admin forbidden response clears stale admin storage', async () => {
  const storage = createStorage({
    rf_userId: '42', rf_userName: 'customer', rf_role: 'ROLE_USER',
    rf_admin_userId: '7', rf_admin_userName: 'admin', rf_admin_role: 'ROLE_ADMIN',
  });
  globalThis.localStorage = storage;
  globalThis.document = { cookie: '' };
  globalThis.fetch = async () => jsonResponse(403, { message: 'Access Denied' });

  await assert.rejects(() => request('/payments/revenue', { authScope: 'admin' }));

  assert.deepEqual(storage.snapshot(), {
    rf_userId: '42', rf_userName: 'customer', rf_role: 'ROLE_USER',
  });
});

test('customer unauthorized response clears only customer storage', async () => {
  const storage = createStorage({
    rf_userId: '42', rf_userName: 'customer', rf_role: 'ROLE_USER',
    rf_admin_userId: '7', rf_admin_userName: 'admin', rf_admin_role: 'ROLE_ADMIN',
  });
  globalThis.localStorage = storage;
  globalThis.document = { cookie: '' };
  globalThis.fetch = async () => jsonResponse(401, { message: 'Unauthorized' });

  await assert.rejects(() => request('/shop/cart', { authScope: 'customer' }));

  assert.deepEqual(storage.snapshot(), {
    rf_admin_userId: '7', rf_admin_userName: 'admin', rf_admin_role: 'ROLE_ADMIN',
  });
});

test('successful DELETE accepts an empty response advertised as JSON', async () => {
  globalThis.document = { cookie: '' };
  globalThis.fetch = async () => ({
    status: 200,
    ok: true,
    statusText: 'OK',
    headers: { get: () => 'application/json' },
    json: async () => {
      throw new SyntaxError('Unexpected end of JSON input');
    },
    text: async () => '',
  });

  const result = await request('/catalog/admin/products/1', {
    method: 'DELETE',
    authScope: 'admin',
  });

  assert.equal(result, null);
});
