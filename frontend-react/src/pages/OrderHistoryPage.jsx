import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import { getUserOrders } from '../features/orders/services/orderService.js';

const formatVND = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount ?? 0);

const STATUS_KEY_MAP = {
  PENDING:    'order.status_pending',
  CONFIRMED:  'order.status_confirmed',
  SHIPPING:   'order.status_shipping',
  DELIVERED:  'order.status_delivered',
  CANCELLED:  'order.status_cancelled',
  PAID:       'order.status_paid',
};

const STATUS_COLORS = {
  PENDING:   { bg: '#fff8e1', color: '#f39c12' },
  CONFIRMED: { bg: '#e8f5e9', color: '#27ae60' },
  SHIPPING:  { bg: '#e3f2fd', color: '#2980b9' },
  DELIVERED: { bg: '#e8f5e9', color: '#27ae60' },
  CANCELLED: { bg: '#fce4ec', color: '#c0392b' },
  PAID:      { bg: '#f3e5f5', color: '#8e44ad' },
};

/**
 * OrderHistoryPage — lists all orders for the current user.
 * Route: /orders  (protected)
 *
 * Each row links to /orders/:id (OrderDetailPage).
 */
export default function OrderHistoryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    setLoading(true);

    getUserOrders(user.id)
      .then(data => {
        if (!active) return;
        const list = Array.isArray(data) ? data : (data?.content || []);
        // newest first
        setOrders(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setError(err.message || t('common.error'));
        setLoading(false);
      });

    return () => { active = false; };
  }, [user?.id, t]);

  return (
    <div className="shell section-padding" style={{ maxWidth: '860px', margin: '0 auto' }}>
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '24px' }}>
        ← {t('common.back')}
      </button>

      <div style={{ marginBottom: '32px' }}>
        <p className="eyebrow">{t('nav.profile')}</p>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 300, fontFamily: 'var(--font-display)' }}>
          {t('order.my_orders')}
        </h1>
      </div>

      {loading && <div className="loading-spinner" aria-label={t('common.loading')} />}

      {error && (
        <div className="empty-state">
          <p style={{ color: '#c0392b' }}>{error}</p>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-state" style={{ paddingTop: '60px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>{t('order.my_orders')}</h2>
          <p className="muted">{t('cart.empty')}</p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map(order => {
            const statusStyle = STATUS_COLORS[order.status] || { bg: 'var(--color-surface)', color: 'var(--color-text)' };
            const itemCount = (order.items || order.orderItems || []).length;
            return (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  padding: '20px 24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  transition: 'box-shadow 0.2s, transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                role="link"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/orders/${order.id}`)}
                aria-label={`${t('order.title')} #${order.id}`}
              >
                {/* Left: order id + date */}
                <div>
                  <p style={{ fontWeight: 700, marginBottom: '2px' }}>#{order.id}</p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '—'}
                    {itemCount > 0 && ` · ${itemCount} sản phẩm`}
                  </p>
                </div>

                {/* Center: status badge */}
                <span style={{
                  background: statusStyle.bg, color: statusStyle.color,
                  borderRadius: '20px', padding: '4px 14px',
                  fontSize: '0.78rem', fontWeight: 700,
                }}>
                  {t(STATUS_KEY_MAP[order.status] || order.status)}
                </span>

                {/* Right: total */}
                <p style={{ fontWeight: 700, fontSize: '1.05rem', minWidth: '120px', textAlign: 'right' }}>
                  {formatVND(order.totalAmount || order.total)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
