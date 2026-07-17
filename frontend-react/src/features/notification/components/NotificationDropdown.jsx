import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import useNotification from '../hooks/useNotification.js';
import useToast from '../hooks/useToast.js';
import { formatDate } from '../../../utils/formatters.js';

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function categoryLabel(category, t) {
  const key = String(category || 'SYSTEM').toLowerCase();
  return t(`notifications.category_${key}`, { defaultValue: key });
}

export default function NotificationDropdown({ userId }) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchUserNotifications,
    markRead,
  } = useNotification();

  useEffect(() => {
    fetchUserNotifications(userId);
  }, [fetchUserNotifications, userId]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!panelRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const handleMarkRead = async (notificationId) => {
    try {
      await markRead(notificationId);
    } catch (requestError) {
      showToast(requestError.message || t('notifications.mark_read_error'), 'error');
    }
  };

  return (
    <div className="notification-menu" ref={panelRef}>
      <button
        id="notification-menu-trigger"
        type="button"
        className="notification-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-label={t('notifications.open', { count: unreadCount })}
        aria-expanded={open}
        aria-controls="notification-dropdown-panel"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="notification-badge" aria-live="polite">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            id="notification-dropdown-panel"
            className="notification-dropdown"
            aria-label={t('notifications.title')}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <header className="notification-dropdown__head">
              <div>
                <span className="notification-dropdown__eyebrow">Furniq updates</span>
                <h2>{t('notifications.title')}</h2>
              </div>
              <span className="notification-dropdown__count">
                {t('notifications.unread', { count: unreadCount })}
              </span>
            </header>

            <div className="notification-dropdown__body">
              {loading && <p className="notification-state">{t('common.loading')}</p>}
              {!loading && error && <p className="notification-state notification-state--error">{error}</p>}
              {!loading && !error && notifications.length === 0 && (
                <div className="notification-empty">
                  <span aria-hidden="true">○</span>
                  <p>{t('notifications.empty')}</p>
                </div>
              )}
              {!loading && !error && notifications.slice(0, 8).map((notification) => (
                <article key={notification.id} className={`notification-item ${notification.read ? '' : 'is-unread'}`}>
                  <span className="notification-item__dot" aria-hidden="true" />
                  <div className="notification-item__content">
                    <div className="notification-item__meta">
                      <span>{categoryLabel(notification.category, t)}</span>
                      <time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
                    </div>
                    <p>{notification.message}</p>
                    {!notification.read && (
                      <button
                        id={`mark-notification-${notification.id}-read`}
                        type="button"
                        className="notification-item__action"
                        onClick={() => handleMarkRead(notification.id)}
                      >
                        {t('notifications.mark_read')}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}