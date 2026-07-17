import { get, post, del } from '../../../api/client.js';

const PREFIX = '/shop';

/** GET /api/shop/cart/{cartId}/items */
export const getCart = (cartId) => get(`${PREFIX}/cart/${cartId}?t=${Date.now()}`);


/** POST /api/shop/cart/{cartId}/items?productId=X&quantity=Y */
export const addItem = (cartId, productId, quantity = 1) =>
  post(`${PREFIX}/cart/${cartId}/items?productId=${productId}&quantity=${quantity}`);

/** DELETE /api/shop/cart/{cartId}/items?productId=X */
export const removeItem = (cartId, productId) =>
  del(`${PREFIX}/cart/${cartId}/items?productId=${productId}`);
