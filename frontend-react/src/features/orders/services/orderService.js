import { post, get, put } from '../../../api/client.js';

const PREFIX = '/shop';
const SHIPPING_PREFIX = '/shipping';

export const createOrder = (userId, cartId, shippingInfo) =>
  post(`${PREFIX}/order/${userId}/cart/${cartId}`, shippingInfo);

export const getOrders = () => get(`${PREFIX}/orders`);

export const getUserOrders = (userId) => get(`${PREFIX}/orders/user/${userId}`);

export const getOrderById = (orderId) => get(`${PREFIX}/order/${orderId}`);

export const getOrderHistory = (orderId) => get(`${PREFIX}/order/${orderId}/history`);

export const getShippingProvinces = () => get(`${SHIPPING_PREFIX}/provinces`);

export const getShippingDistricts = (provinceId) =>
  get(`${SHIPPING_PREFIX}/districts?provinceId=${encodeURIComponent(provinceId)}`);

export const getShippingWards = (districtId) =>
  get(`${SHIPPING_PREFIX}/wards?districtId=${encodeURIComponent(districtId)}`);

export const calculateShippingFee = (payload) =>
  post(`${SHIPPING_PREFIX}/fee`, payload);

export const adminUpdateOrderStatus = (orderId, status) =>
  put(`${PREFIX}/order/${orderId}/status?status=${status}`, undefined, { authScope: 'admin' });

export const cancelOrder = (orderId) =>
  put(`${PREFIX}/order/${orderId}/cancel`);
