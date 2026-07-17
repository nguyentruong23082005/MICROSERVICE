import { del, get, post } from '../../../api/client.js';

const PREFIX = '/review';

function normalizeProductId(productId) {
  const value = String(productId ?? '').trim();
  if (!/^\d+$/.test(value)) {
    throw new Error('Mã sản phẩm yêu thích không hợp lệ.');
  }
  return value;
}

export const getWishlist = (userId) => get(`${PREFIX}/${userId}/wishlist`);

export const addWishlistItem = (userId, productId) =>
  post(`${PREFIX}/${userId}/wishlist/${normalizeProductId(productId)}`);

export const removeWishlistItem = (userId, productId) =>
  del(`${PREFIX}/${userId}/wishlist/${normalizeProductId(productId)}`);
