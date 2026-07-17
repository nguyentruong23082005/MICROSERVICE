import { useState, useCallback } from 'react';
import {
  getNotificationsByUserId,
  getAdminNotifications,
  markNotificationAsRead,
} from '../services/notificationService.js';
import { countUnread, markNotificationRead } from '../utils/notificationState.js';

export function useNotification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async (loader, fallbackMessage) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loader();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotifications([]);
      if (err.status !== 404) {
        setError(err.message || fallbackMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserNotifications = useCallback((userId) => {
    if (!userId) return Promise.resolve();
    return loadNotifications(
      () => getNotificationsByUserId(userId),
      'Không thể tải thông báo',
    );
  }, [loadNotifications]);

  const fetchAdminNotifications = useCallback(() => loadNotifications(
    getAdminNotifications,
    'Không thể tải thông báo quản trị',
  ), [loadNotifications]);

  const markRead = useCallback(async (notificationId) => {
    const updated = await markNotificationAsRead(notificationId);
    setNotifications((current) => markNotificationRead(current, notificationId));
    return updated;
  }, []);

  return {
    notifications,
    unreadCount: countUnread(notifications),
    loading,
    error,
    fetchUserNotifications,
    fetchAdminNotifications,
    markRead,
  };
}

export default useNotification;
