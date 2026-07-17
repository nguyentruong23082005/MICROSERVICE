/**
 * Biến môi trường và fallback values.
 * Tất cả env vars của app được đọc ở một nơi duy nhất.
 */
export const GATEWAY_BASE_URL =
  import.meta.env.VITE_GATEWAY_BASE_URL || 'http://localhost:8900';

export const API_BASE =
  import.meta.env.VITE_API_BASE || `${GATEWAY_BASE_URL}/api`;

export const IS_DEV = import.meta.env.DEV === true;
export const IS_PROD = import.meta.env.PROD === true;
