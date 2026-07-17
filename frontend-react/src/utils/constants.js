/** Application name */
export const APP_NAME = 'Furniq Furniture';

/** API gateway base */
export const GATEWAY_BASE_URL = import.meta.env.VITE_GATEWAY_BASE_URL || 'http://localhost:8900';

/** API base path */
export const API_BASE = import.meta.env.VITE_API_BASE || `${GATEWAY_BASE_URL}/api`;

/** User roles */
export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  USER: 'ROLE_USER',
};

/** localStorage keys for non-sensitive user metadata */
export const STORAGE_KEYS = {
  USER_ID: 'rf_userId',
  USER_NAME: 'rf_userName',
  ROLE: 'rf_role',
};

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;
export const ADMIN_PAGE_SIZE = 10;

/** Product availability threshold to show "low stock" warning */
export const LOW_STOCK_THRESHOLD = 5;
