import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendUniqueMessage,
  buildAdminChatWebSocketUrl,
  buildCustomerIdentity,
  getAdminSupport,
  isRegisteredCustomerId,
  reduceChatConnection,
} from './adminChatModel.js';

test('isRegisteredCustomerId only accepts positive numeric account identifiers', () => {
  assert.equal(isRegisteredCustomerId('42'), true);
  assert.equal(isRegisteredCustomerId('guest-42'), false);
  assert.equal(isRegisteredCustomerId('0'), false);
  assert.equal(isRegisteredCustomerId('42abc'), false);
});

test('buildCustomerIdentity uses the real user-service profile name and contact fields', () => {
  const identity = buildCustomerIdentity('42', {
    id: 42,
    userName: 'truong.nguyen',
    role: 'ROLE_USER',
    active: 1,
    userDetails: {
      firstName: 'Trường',
      lastName: 'Nguyễn',
      email: 'truong@example.com',
      phoneNumber: '0901234567',
      locality: 'Đà Nẵng',
      country: 'Việt Nam',
    },
  });

  assert.equal(identity.displayName, 'Trường Nguyễn');
  assert.equal(identity.accountName, 'truong.nguyen');
  assert.equal(identity.email, 'truong@example.com');
  assert.equal(identity.phoneNumber, '0901234567');
  assert.equal(identity.location, 'Đà Nẵng, Việt Nam');
  assert.equal(identity.kind, 'registered');
});

test('buildCustomerIdentity labels guest sessions without inventing profile data', () => {
  const identity = buildCustomerIdentity('guest-a1b2');

  assert.equal(identity.displayName, 'Khách chưa đăng nhập');
  assert.equal(identity.sessionId, 'guest-a1b2');
  assert.equal(identity.email, null);
  assert.equal(identity.phoneNumber, null);
  assert.equal(identity.kind, 'guest');
});

test('buildCustomerIdentity distinguishes loading from a confirmed missing profile', () => {
  const loadingIdentity = buildCustomerIdentity('42');
  const missingIdentity = buildCustomerIdentity('42', null, { profileMissing: true });

  assert.equal(loadingIdentity.displayName, 'Đang tải hồ sơ...');
  assert.equal(loadingIdentity.kind, 'loading');
  assert.equal(missingIdentity.displayName, 'Không tìm thấy hồ sơ');
  assert.equal(missingIdentity.sessionId, '42');
  assert.equal(missingIdentity.kind, 'missing');
});

test('buildCustomerIdentity exposes profile-service failures without claiming the account is missing', () => {
  const identity = buildCustomerIdentity('42', null, { profileError: true });

  assert.equal(identity.displayName, 'Không tải được hồ sơ');
  assert.equal(identity.kind, 'error');
});

test('appendUniqueMessage keeps state immutable and deduplicates persisted message IDs', () => {
  const existing = [{ id: 7, content: 'Xin chào' }];
  const duplicateResult = appendUniqueMessage(existing, { id: 7, content: 'Xin chào' });
  const appendedResult = appendUniqueMessage(existing, { id: 8, content: 'Tôi cần hỗ trợ' });

  assert.strictEqual(duplicateResult, existing);
  assert.deepEqual(appendedResult, [
    { id: 7, content: 'Xin chào' },
    { id: 8, content: 'Tôi cần hỗ trợ' },
  ]);
  assert.deepEqual(existing, [{ id: 7, content: 'Xin chào' }]);
});

test('reduceChatConnection treats a failed candidate as reconnecting instead of a terminal red error', () => {
  const initial = Object.freeze({ status: 'connecting', ready: false, error: null });

  const reconnecting = reduceChatConnection(initial, {
    type: 'candidate-failed',
    hasNextCandidate: true,
  });

  assert.deepEqual(reconnecting, {
    status: 'reconnecting',
    ready: false,
    error: null,
  });
  assert.deepEqual(initial, { status: 'connecting', ready: false, error: null });
});

test('reduceChatConnection clears an earlier connection error when a later candidate opens', () => {
  const failed = Object.freeze({
    status: 'offline',
    ready: false,
    error: 'Không kết nối được chat admin.',
  });

  const connected = reduceChatConnection(failed, { type: 'connected' });

  assert.deepEqual(connected, {
    status: 'online',
    ready: true,
    error: null,
  });
});

test('buildAdminChatWebSocketUrl uses only the gateway support-chat route', () => {
  assert.equal(
    buildAdminChatWebSocketUrl('http://localhost:8900'),
    'ws://localhost:8900/ws/support-chat?authScope=admin'
  );
  assert.equal(
    buildAdminChatWebSocketUrl('https://shop.example.com'),
    'wss://shop.example.com/ws/support-chat?authScope=admin'
  );
});

test('getAdminSupport delegates to the gateway client with the admin auth scope', async () => {
  const calls = [];
  const gatewayGet = async (path, options) => {
    calls.push({ path, options });
    return ['guest-1'];
  };

  const result = await getAdminSupport('/support-chat/sessions', gatewayGet);

  assert.deepEqual(result, ['guest-1']);
  assert.deepEqual(calls, [{
    path: '/support-chat/sessions',
    options: { authScope: 'admin' },
  }]);
});

test('getAdminSupport propagates gateway failures instead of hiding them with a direct-service fallback', async () => {
  const gatewayError = Object.assign(new Error('Gateway route unavailable'), { status: 404 });
  const gatewayGet = async () => {
    throw gatewayError;
  };

  await assert.rejects(
    getAdminSupport('/support-chat/sessions', gatewayGet),
    (error) => error === gatewayError
  );
});
