import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useNotification from '../../notification/hooks/useNotification.js';
import useToast from '../../notification/hooks/useToast.js';
import { formatDate } from '../../../utils/formatters.js';
import Pagination from '../components/Pagination.jsx';
import { paginateItems } from '../utils/paginateItems.js';
import { ADMIN_PAGE_SIZE } from '../../../utils/constants.js';

export default function Notifications() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchAdminNotifications,
    markRead,
  } = useNotification();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAdminNotifications();
  }, [fetchAdminNotifications]);

  const handleMarkRead = async (notificationId) => {
    try {
      await markRead(notificationId);
      showToast(t('notifications.mark_read_success'), 'success');
    } catch (requestError) {
      showToast(requestError.message || t('notifications.mark_read_error'), 'error');
    }
  };

  const categoryCounts = notifications.reduce((counts, notification) => {
    const category = String(notification.category || 'SYSTEM').toUpperCase();
    return { ...counts, [category]: (counts[category] || 0) + 1 };
  }, {});

  return (
    <div className="admin-notifications-page admin-page-shell">
      <div className="admin-page-head">
        <div>
          <span className="admin-notifications-eyebrow">Live operations</span>
          <h1 className="admin-page-title">{t('notifications.admin_title')}</h1>
          <p className="admin-subtitle">{t('notifications.admin_description')}</p>
        </div>
        <button id="refresh-admin-notifications" className="admin-btn-secondary" type="button" onClick={fetchAdminNotifications} disabled={loading}>
          {t('notifications.refresh')}
        </button>
      </div>

      {error && <div className="admin-notice admin-notice-error">{error}</div>}

      <section className="admin-notification-stats" aria-label={t('notifications.summary')}>
        <article className="admin-notification-stat admin-notification-stat--dark">
          <span>{t('notifications.unread_label')}</span>
          <strong>{loading ? '…' : unreadCount}</strong>
          <small>{t('notifications.requires_attention')}</small>
        </article>
        <article className="admin-notification-stat">
          <span>{t('notifications.total')}</span>
          <strong>{loading ? '…' : notifications.length}</strong>
          <small>{t('notifications.activity_stream')}</small>
        </article>
        <article className="admin-notification-stat admin-notification-stat--accent">
          <span>{t('notifications.payments')}</span>
          <strong>{loading ? '…' : (categoryCounts.PAYMENT || 0)}</strong>
          <small>{t('notifications.revenue_signals')}</small>
        </article>
      </section>

      <section className="admin-notification-feed" aria-labelledby="admin-notification-feed-title">
        <div className="admin-notification-feed__head">
          <div>
            <span>{t('notifications.timeline')}</span>
            <h2 id="admin-notification-feed-title">{t('notifications.latest_activity')}</h2>
          </div>
          <span className="admin-notification-feed__live"><i aria-hidden="true" /> {t('notifications.live')}</span>
        </div>

        {loading && <div className="admin-empty">{t('common.loading')}</div>}
        {!loading && notifications.length === 0 && <div className="admin-empty">{t('notifications.empty')}</div>}
        {!loading && paginateItems(notifications, currentPage, ADMIN_PAGE_SIZE).items.map((notification) => (
          <article key={notification.id} className={`admin-notification-row ${notification.read ? '' : 'is-unread'}`}>
            <div className={`admin-notification-row__icon admin-notification-row__icon--${String(notification.category || 'system').toLowerCase()}`} aria-hidden="true">
              {String(notification.category || 'S').slice(0, 1)}
            </div>
            <div className="admin-notification-row__content">
              <div className="admin-notification-row__meta">
                <span>{t(`notifications.category_${String(notification.category || 'system').toLowerCase()}`)}</span>
                <time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
              </div>
              <p>{notification.message}</p>
              <div className="admin-notification-row__refs">
                {notification.orderId && <span>Order #{notification.orderId}</span>}
                {notification.paymentId && <span>Payment #{notification.paymentId}</span>}
              </div>
            </div>
            {!notification.read ? (
              <button id={`admin-mark-notification-${notification.id}-read`} type="button" className="admin-notification-row__action" onClick={() => handleMarkRead(notification.id)}>
                {t('notifications.mark_read')}
              </button>
            ) : (
              <span className="admin-notification-row__read">{t('notifications.read')}</span>
            )}
          </article>
        ))}
        <Pagination
          currentPage={currentPage}
          totalPages={paginateItems(notifications, currentPage, ADMIN_PAGE_SIZE).totalPages}
          onPageChange={setCurrentPage}
        />
      </section>
    </div>
  );
}