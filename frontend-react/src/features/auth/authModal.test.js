import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getSocialAuthErrorKey } from './socialAuthErrors.js';
import { validateRegistration } from './authValidation.js';

const SOURCE_ROOT = new URL('../../', import.meta.url);

test('registration validation reports each invalid customer field', () => {
  const errors = validateRegistration({ username: 'ab', email: 'not-an-email', password: 'short', confirmPassword: 'different' });
  assert.deepEqual(errors, { username: 'username_length', email: 'email_invalid', password: 'password_length', confirmPassword: 'password_mismatch' });
});

test('registration validation accepts a valid immutable form value', () => {
  const form = Object.freeze({ username: 'furniq_customer', email: 'customer@furniq.vn', password: 'Furniq@2026', confirmPassword: 'Furniq@2026' });
  assert.deepEqual(validateRegistration(form), {});
  assert.equal(form.username, 'furniq_customer');
});

test('customer authentication uses an accessible modal with login and register modes', async () => {
  const modal = await readFile(new URL('features/auth/components/AuthModal.jsx', SOURCE_ROOT), 'utf8');
  assert.match(modal, /role=["']dialog["']/);
  assert.match(modal, /aria-modal=["']true["']/);
  assert.match(modal, /CustomerLoginForm/);
  assert.match(modal, /CustomerRegisterForm/);
  assert.match(modal, /Escape/);
  assert.match(modal, /auth-modal-title/);
});

test('customer auth routes render over the storefront while admin login remains standalone', async () => {
  const [app, modalRoute, header] = await Promise.all([
    readFile(new URL('App.jsx', SOURCE_ROOT), 'utf8'),
    readFile(new URL('features/auth/components/AuthModalRoute.jsx', SOURCE_ROOT), 'utf8'),
    readFile(new URL('components/layout/Header.jsx', SOURCE_ROOT), 'utf8'),
  ]);
  assert.match(app, /path=["']\/login["'][\s\S]*AuthModalRoute/);
  assert.match(app, /path=["']\/register["'][\s\S]*AuthModalRoute/);
  assert.match(app, /path=["']\/admin\/login["'][\s\S]*LoginPage\s+adminOnly/);
  assert.match(modalRoute, /ClientLayout/);
  assert.match(header, /aria-haspopup=["']dialog["']/);
  assert.doesNotMatch(header, /admin-entry-btn|auth\.admin_login/);
});

test('registration form preserves the backend password contract', async () => {
  const form = await readFile(new URL('features/auth/components/CustomerRegisterForm.jsx', SOURCE_ROOT), 'utf8');
  assert.match(form, /userPassword:\s*values\.password/);
  assert.doesNotMatch(form, /\n\s*password:\s*values\.password/);
});

test('customer login and registration expose Google and Facebook authentication', async () => {
  const [loginForm, registerForm, socialButtons] = await Promise.all([
    readFile(new URL('features/auth/components/CustomerLoginForm.jsx', SOURCE_ROOT), 'utf8'),
    readFile(new URL('features/auth/components/CustomerRegisterForm.jsx', SOURCE_ROOT), 'utf8'),
    readFile(new URL('features/auth/components/SocialAuthButtons.jsx', SOURCE_ROOT), 'utf8'),
  ]);

  assert.match(loginForm, /SocialAuthButtons/);
  assert.match(registerForm, /SocialAuthButtons/);
  assert.match(socialButtons, /signInWithGoogle/);
  assert.match(socialButtons, /signInWithFacebook/);
  assert.match(socialButtons, /firebaseLogin/);
  assert.match(socialButtons, /id:\s*["']customer-google-auth["']/);
  assert.match(socialButtons, /id:\s*["']customer-facebook-auth["']/);
});

test('social authentication maps backend and popup failures to safe user messages', () => {
  assert.equal(getSocialAuthErrorKey({ status: 401 }), 'auth.social_token_invalid');
  assert.equal(getSocialAuthErrorKey({ status: 503 }), 'auth.social_service_unavailable');
  assert.equal(getSocialAuthErrorKey({ code: 'auth/popup-closed-by-user' }), null);
  assert.equal(getSocialAuthErrorKey({ code: 'auth/cancelled-popup-request' }), null);
  assert.equal(getSocialAuthErrorKey({ code: 'auth/popup-blocked' }), 'auth.social_popup_blocked');
  assert.equal(getSocialAuthErrorKey({ code: 'auth/operation-not-allowed' }), 'auth.social_provider_disabled');
  assert.equal(getSocialAuthErrorKey({ code: 'auth/account-exists-with-different-credential' }), 'auth.social_account_conflict');
  assert.equal(getSocialAuthErrorKey({ code: 'auth/network-request-failed' }), 'auth.social_service_unavailable');
  assert.equal(getSocialAuthErrorKey(new Error('internal certificate detail')), 'auth.social_login_failed');
});

test('social authentication prevents duplicate popup and token exchange attempts while one is active', async () => {
  const socialButtons = await readFile(new URL('features/auth/components/SocialAuthButtons.jsx', SOURCE_ROOT), 'utf8');

  assert.match(socialButtons, /useRef/);
  assert.match(socialButtons, /inFlightRef\.current/);
  assert.match(socialButtons, /if\s*\(inFlightRef\.current\)\s*return/);
  assert.match(socialButtons, /inFlightRef\.current\s*=\s*true/);
  assert.match(socialButtons, /inFlightRef\.current\s*=\s*false/);
});
