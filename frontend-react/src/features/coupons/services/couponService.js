import { get } from '../../../api/client.js';

const PREFIX = '';

export const getActiveCoupons = () => get(`${PREFIX}/coupons`);

export const previewCoupon = (code, subtotal) =>
  get(`${PREFIX}/coupons/${encodeURIComponent(code)}/preview?subtotal=${encodeURIComponent(subtotal)}`);
