const TOAST_TYPES = new Set(['success', 'error', 'info']);

export function toastReducer(state = [], action = {}) {
  if (action.type === 'add' && action.toast) {
    const type = TOAST_TYPES.has(action.toast.type) ? action.toast.type : 'info';
    return [...state, { ...action.toast, type }];
  }

  if (action.type === 'remove') {
    return state.filter(({ id }) => id !== action.id);
  }

  return [...state];
}

export function markNotificationRead(notifications = [], notificationId) {
  return notifications.map((notification) =>
    notification.id === notificationId && !notification.read
      ? { ...notification, read: true }
      : notification,
  );
}

export function countUnread(notifications = []) {
  return Array.isArray(notifications)
    ? notifications.reduce((count, notification) => count + (notification?.read ? 0 : 1), 0)
    : 0;
}