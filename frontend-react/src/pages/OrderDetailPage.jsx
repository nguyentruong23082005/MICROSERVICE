import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getOrderById } from '../features/orders/services/orderService.js';

/**
 * Format currency in VND
 */
const formatVND = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount ?? 0);

/**
 * Map backend status string → translation key
 */
const STATUS_KEY_MAP = {
  PENDING:    'order.status_pending',
  CONFIRMED:  'order.status_confirmed',
  SHIPPING:   'order.status_shipping',
  DELIVERED:  'order.status_delivered',
  CANCELLED:  'order.status_cancelled',
  PAID:       'order.status_paid',
};

/**
 * Status badge with color coding
 */
function StatusBadge({ status, t }) {
  const colors = {
    PENDING:   { bg: '#fff8e1', color: '#f39c12' },
    CONFIRMED: { bg: '#e8f5e9', color: '#27ae60' },
    SHIPPING:  { bg: '#e3f2fd', color: '#2980b9' },
    DELIVERED: { bg: '#e8f5e9', color: '#27ae60' },
    CANCELLED: { bg: '#fce4ec', color: '#c0392b' },
    PAID:      { bg: '#f3e5f5', color: '#8e44ad' },
  };
  const style = colors[status] || { bg: 'var(--color-surface)', color: 'var(--color-text)' };
  return (
    <span style={{
      background: style.bg, color: style.color,
      borderRadius: '20px', padding: '4px 14px',
      fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em',
    }}>
      {t(STATUS_KEY_MAP[status] || status)}
    </span>
  );
}

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getOrderById(orderId)
      .then(data => { if (active) { setOrder(data); setLoading(false); } })
      .catch(err => { if (active) { setError(err.message || t('common.error')); setLoading(false); } });

    return () => { active = false; };
  }, [orderId, t]);

  if (loading) {
    return (
      <div className="shell section-padding" style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
        <div className="loading-spinner" aria-label={t('common.loading')} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="shell section-padding">
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '24px' }}>
          ← {t('common.back')}
        </button>
        <div className="empty-state">
          <p style={{ color: '#c0392b' }}>{error || t('common.error')}</p>
        </div>
      </div>
    );
  }

  const items = order.items || order.orderItems || [];
  const shipping = order.shippingInfo || order.address || {};
  const paymentStatus = order.paymentStatus || order.payment?.status;

  return (
    <div className="shell section-padding" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '24px' }}>
        ← {t('common.back')}
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <div>
          <p className="eyebrow">{t('order.title')}</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
            #{order.id}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '—'}
          </p>
        </div>
        <StatusBadge status={order.status} t={t} />
      </div>

      {/* Items */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {t('order.items')}
        </h2>
        <div style={{ borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          {items.map((item, i) => (
            <div key={item.id || i} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px 20px',
              borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}>
              {item.productImage && (
                <img src={item.productImage} alt={item.productName}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.productName || item.name || `Product #${item.productId}`}
                </p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  {t('product.quantity')}: {item.quantity}
                </p>
              </div>
              <p style={{ fontWeight: 700, flexShrink: 0 }}>
                {formatVND(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Two-column: Shipping + Payment summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Shipping */}
        <section style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '20px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            {t('order.shipping')}
          </h2>
          {[
            shipping.fullName || shipping.name,
            shipping.phone,
            shipping.address,
            [shipping.city, shipping.district, shipping.ward].filter(Boolean).join(', '),
          ].filter(Boolean).map((line, i) => (
            <p key={i} style={{ fontSize: '0.9rem', marginBottom: '4px', color: i === 0 ? 'inherit' : 'var(--color-text-muted)' }}>
              {line}
            </p>
          ))}
        </section>

        {/* Payment summary */}
        <section style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '20px', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            {t('payment.method')}
          </h2>
          <p style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
            {order.paymentMethod === 'VNPAY' ? t('payment.vnpay')
              : order.paymentMethod === 'MOMO' ? t('payment.momo')
              : t('payment.cod')}
          </p>
          {paymentStatus && (
            <StatusBadge status={paymentStatus === 'COMPLETED' ? 'PAID' : paymentStatus} t={t} />
          )}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem' }}>
              <span>{t('order.total')}</span>
              <span>{formatVND(order.totalAmount || order.total)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
