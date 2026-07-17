import { get, patch } from '../../../api/client.js';

const PREFIX = '/notifications';
const SAFE_NOTIFICATION_ID = /^[A-Za-z0-9_-]{1,128}$/;

function requireUserId(userId) {
  const normalized = Number(userId);
  if (!Number.isSafeInteger(normalized) || normalized <= 0) {
    throw new TypeError('A valid user identifier is required');
  }
  return normalized;
}

function requireNotificationId(notificationId) {
  const normalized = String(notificationId ?? '').trim();
  if (!SAFE_NOTIFICATION_ID.test(normalized)) {
    throw new TypeError('A valid notification identifier is required');
  }
  return normalized;
}

/** GET /api/notifications — lấy tất cả thông báo */
export const getAllNotifications = () => get(PREFIX);

/** GET /api/notifications/user/{userId} — lấy thông báo của user */
export const getNotificationsByUserId = (userId) => get(`${PREFIX}/user/${requireUserId(userId)}`);

/** GET /api/notifications/admin — lấy thông báo của admin */
export const getAdminNotifications = () => get(`${PREFIX}/admin`, { authScope: 'admin' });

export async function getUnreadNotificationCount(userId) {
  const response = await get(`${PREFIX}/user/${requireUserId(userId)}/unread-count`);
  if (!Number.isSafeInteger(response?.count) || response.count < 0) {
    throw new Error('The notification service returned an invalid unread count');
  }
  return response.count;
}

export async function markNotificationAsRead(notificationId) {
  return patch(`${PREFIX}/${requireNotificationId(notificationId)}/read`);
}
