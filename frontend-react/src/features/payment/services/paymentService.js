import { get, request } from '../../../api/client.js';
import { ENDPOINTS } from '../../../api/endpoints.js';

const PREFIX = '/payments';

/** GET /api/payments — lấy danh sách tất cả giao dịch thanh toán */
export const getAllPayments = () => get(PREFIX, { authScope: 'admin' });

/** GET /api/payments/order/{orderId} — lấy thông tin thanh toán theo đơn hàng */
export async function getPaymentsByOrderId(orderId) {
  const normalizedOrderId = Number(orderId);
  if (!Number.isSafeInteger(normalizedOrderId) || normalizedOrderId <= 0) {
    throw new Error('A valid order identifier is required');
  }

  return get(`${PREFIX}/order/${normalizedOrderId}`);
}

/** GET /api/payments/revenue — lấy thống kê doanh thu */
export const getRevenueStatistics = () => get(`${PREFIX}/revenue`, { authScope: 'admin' });

const GATEWAY_CREATE_ENDPOINTS = Object.freeze({
  VNPAY: ENDPOINTS.vnpay.create,
  MOMO: ENDPOINTS.momo.create,
});

const GATEWAY_REDIRECT_HOSTS = Object.freeze({
  VNPAY: Object.freeze(['sandbox.vnpayment.vn', 'pay.vnpay.vn']),
  MOMO: Object.freeze(['test-payment.momo.vn', 'payment.momo.vn']),
});

const PAYMENT_RESULT_STATES = Object.freeze({
  COMPLETED: 'success',
  FAILED: 'failed',
  PENDING: 'pending',
});

const GATEWAY_METHODS = Object.freeze(['VNPAY', 'MOMO']);

export function resolvePaymentResult(orderId, payments) {
  const normalizedOrderId = Number(orderId);
  if (!Number.isSafeInteger(normalizedOrderId) || normalizedOrderId <= 0) {
    throw new Error('A valid order identifier is required');
  }

  const gatewayPayments = Array.isArray(payments)
    ? payments.filter((payment) => (
        Number(payment?.orderId) === normalizedOrderId
        && GATEWAY_METHODS.includes(String(payment?.paymentMethod || '').toUpperCase())
      ))
    : [];

  const latestPayment = gatewayPayments.reduce((latest, payment) => (
    Number(payment?.id) > Number(latest?.id ?? -1) ? payment : latest
  ), null);

  const persistedStatus = String(latestPayment?.status || 'PENDING').toUpperCase();
  return Object.freeze({
    state: PAYMENT_RESULT_STATES[persistedStatus] || 'pending',
    payment: latestPayment,
  });
}

/**
 * Creates a sandbox gateway session using only the persisted order identifier.
 * The payable amount is resolved by payment-service and is never sent by the browser.
 */
export async function createGatewayPayment(method, orderId) {
  const normalizedMethod = String(method || '').toUpperCase();
  const endpoint = GATEWAY_CREATE_ENDPOINTS[normalizedMethod];
  if (!endpoint) {
    throw new Error(`Unsupported payment method: ${method}`);
  }

  const normalizedOrderId = Number(orderId);
  if (!Number.isSafeInteger(normalizedOrderId) || normalizedOrderId <= 0) {
    throw new Error('A valid order identifier is required');
  }

  const query = new URLSearchParams({ orderId: String(normalizedOrderId) });
  const response = await request(`${endpoint}?${query}`, { method: 'POST' });
  if (typeof response?.payUrl !== 'string' || response.payUrl.trim() === '') {
    throw new Error('Payment gateway did not return a redirect URL');
  }

  let redirectUrl;
  try {
    redirectUrl = new URL(response.payUrl);
  } catch {
    throw new Error('Payment gateway returned an invalid redirect URL');
  }
  if (redirectUrl.protocol !== 'https:') {
    throw new Error('Payment gateway redirect URL must use HTTPS');
  }
  if (!GATEWAY_REDIRECT_HOSTS[normalizedMethod].includes(redirectUrl.hostname)) {
    throw new Error('Payment gateway returned an untrusted host');
  }

  return redirectUrl.toString();
}
