import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getUnreadNotificationCount,
  markNotificationAsRead,
} from './notificationService.js';

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;

globalThis.localStorage = {
  getItem: () => 'test-token',
  removeItem: () => {},
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test.after(() => {
  if (originalLocalStorage === undefined) {
    delete globalThis.localStorage;
    return;
  }
  globalThis.localStorage = originalLocalStorage;
});

test('loads the authenticated user unread count', async () => {
  let capturedRequest;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url, options };
    return jsonResponse({ count: 4 });
  };

  const count = await getUnreadNotificationCount(42);

  assert.equal(count, 4);
  assert.equal(capturedRequest.url, 'http://localhost:8900/api/notifications/user/42/unread-count');
  assert.equal(capturedRequest.options.method, 'GET');
});

test('marks a notification read with PATCH', async () => {
  let capturedRequest;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url, options };
    return jsonResponse({ id: 'notification-1', read: true });
  };

  const notification = await markNotificationAsRead('notification-1');

  assert.equal(notification.read, true);
  assert.equal(capturedRequest.url, 'http://localhost:8900/api/notifications/notification-1/read');
  assert.equal(capturedRequest.options.method, 'PATCH');
});

test('rejects invalid user IDs before requesting unread count', async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return jsonResponse({ count: 0 });
  };

  await assert.rejects(() => getUnreadNotificationCount(0), /valid user identifier/);
  assert.equal(fetchCalled, false);
});

test('rejects unsafe notification IDs before sending PATCH', async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return jsonResponse({});
  };

  await assert.rejects(() => markNotificationAsRead('../admin'), /valid notification identifier/);
  assert.equal(fetchCalled, false);
});