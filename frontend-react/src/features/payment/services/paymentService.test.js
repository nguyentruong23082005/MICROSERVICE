import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createGatewayPayment,
  getPaymentsByOrderId,
  resolvePaymentResult,
} from './paymentService.js';

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;

globalThis.localStorage = {
  getItem: () => null,
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

test('creates a VNPay redirect using only the trusted order identifier', async () => {
  let capturedRequest;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url, options };
    return jsonResponse({ payUrl: 'https://sandbox.vnpayment.vn/pay' });
  };

  const payUrl = await createGatewayPayment('VNPAY', 42);

  assert.equal(payUrl, 'https://sandbox.vnpayment.vn/pay');
  assert.equal(capturedRequest.url, 'http://localhost:8900/api/payments/vnpay/create?orderId=42');
  assert.equal(capturedRequest.options.method, 'POST');
  assert.equal(capturedRequest.options.body, undefined);
  assert.equal(capturedRequest.url.includes('amount='), false);
});

test('creates a MoMo redirect using its dedicated endpoint', async () => {
  let capturedUrl;
  globalThis.fetch = async (url) => {
    capturedUrl = url;
    return jsonResponse({ payUrl: 'https://test-payment.momo.vn/pay' });
  };

  const payUrl = await createGatewayPayment('MOMO', 84);

  assert.equal(payUrl, 'https://test-payment.momo.vn/pay');
  assert.equal(capturedUrl, 'http://localhost:8900/api/payments/momo/create?orderId=84');
});

test('rejects unsupported payment methods before sending a request', async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return jsonResponse({ payUrl: 'https://example.test' });
  };

  await assert.rejects(() => createGatewayPayment('CARD', 42), /Unsupported payment method/);
  assert.equal(fetchCalled, false);
});

test('rejects an invalid order identifier before sending a request', async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return jsonResponse({ payUrl: 'https://example.test' });
  };

  await assert.rejects(() => createGatewayPayment('VNPAY', 0), /valid order identifier/);
  assert.equal(fetchCalled, false);
});

test('fails closed when the gateway response has no redirect URL', async () => {
  globalThis.fetch = async () => jsonResponse({});

  await assert.rejects(() => createGatewayPayment('MOMO', 42), /redirect URL/);
});

test('rejects HTTPS redirect URLs from untrusted hosts', async () => {
  globalThis.fetch = async () => jsonResponse({ payUrl: 'https://payments.attacker.example/collect' });

  await assert.rejects(() => createGatewayPayment('VNPAY', 42), /untrusted host/);
});

test('resolves the latest persisted gateway payment as the source of truth', () => {
  const result = resolvePaymentResult(42, [
    { id: 7, orderId: 42, paymentMethod: 'VNPAY', status: 'PENDING' },
    { id: 9, orderId: 42, paymentMethod: 'VNPAY', status: 'COMPLETED' },
    { id: 8, orderId: 42, paymentMethod: 'VNPAY', status: 'FAILED' },
  ]);

  assert.equal(result.state, 'success');
  assert.equal(result.payment.id, 9);
});

test('keeps a persisted pending payment pending despite a success callback hint', () => {
  const result = resolvePaymentResult(42, [
    { id: 10, orderId: 42, paymentMethod: 'MOMO', status: 'PENDING' },
  ]);

  assert.equal(result.state, 'pending');
});

test('rejects invalid payment result order identifiers', () => {
  assert.throws(() => resolvePaymentResult('not-an-order', []), /valid order identifier/);
});

test('rejects invalid payment lookup identifiers before sending a request', async () => {
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return jsonResponse([]);
  };

  await assert.rejects(
    () => getPaymentsByOrderId('not-an-order'),
    /valid order identifier/,
  );
  assert.equal(fetchCalled, false);
});