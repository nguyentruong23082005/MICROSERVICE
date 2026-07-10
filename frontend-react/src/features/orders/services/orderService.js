import { post, get, put } from '../../../api/client.js';

const PREFIX = '/shop';

export const createOrder = (userId, cartId, shippingInfo) =>
  post(`${PREFIX}/order/${userId}/cart/${cartId}`, shippingInfo);

export const getOrders = () => get(`${PREFIX}/orders`);

export const getUserOrders = (userId) => get(`${PREFIX}/orders/user/${userId}`);

export const adminUpdateOrderStatus = (orderId, status) =>
  put(`${PREFIX}/order/${orderId}/status?status=${status}`);

export const cancelOrder = (orderId) =>
  put(`${PREFIX}/order/${orderId}/cancel`);
