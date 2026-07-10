import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import { getUserOrders, cancelOrder } from '../features/orders/services/orderService.js';
import {
  orderDateLabel,
  orderDisplayId,
  orderItemsCount,
  orderStatus,
  orderTotal,
} from '../features/orders/utils/orderViewModel.js';
import { initials, money } from '../utils/formatters.js';
import { translateStatus } from '../utils/uiText.js';

function statusColor(status) {
  if (status === 'DELIVERED' || status === 'COMPLETED' || status === 'PAID') return 'var(--color-olive)';
  if (status === 'CANCELLED' || status === 'FAILED' || status === 'PAYMENT_FAILED') return '#B85042';
  return 'var(--color-wood)';
}

function productInfo(item = {}) {
  return item.product || item;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userId = user?.userId || user?.id;

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    if (!userId) return;
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoadingOrders(true);
        setOrdersError('');
        return getUserOrders(userId);
      })
      .then((data) => {
        if (active && data) setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setOrdersError(err.message || 'Không thể tải lịch sử đơn hàng.');
      })
      .finally(() => {
        if (active) setLoadingOrders(false);
      });

    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  const NON_CANCELLABLE = new Set(['DELIVERED', 'CANCELLED', 'COMPLETED']);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn huỷ đơn hàng này không?')) return;
    setCancellingId(orderId);
    setCancelError('');
    try {
      await cancelOrder(orderId);
      setReloadKey((v) => v + 1);
    } catch (err) {
      setCancelError(err.message || 'Không thể huỷ đơn hàng. Vui lòng thử lại.');
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <div className="shell section-padding" style={{ textAlign: 'center' }}>
        <h2>Vui lòng đăng nhập để xem tài khoản.</h2>
        <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>Về trang chủ</button>
      </div>
    );
  }

  const renderOrders = () => {
    if (loadingOrders) {
      return (
        <div className="empty-state" style={{ padding: '48px 24px' }} aria-busy="true">
          <p className="muted">Đang tải lịch sử đơn hàng...</p>
        </div>
      );
    }

    if (ordersError) {
      return (
        <div className="empty-state" style={{ padding: '48px 24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '8px' }}>Chưa tải được đơn hàng</h3>
          <p className="muted" style={{ marginBottom: '24px' }}>{ordersError}</p>
          <button className="btn btn-outline" onClick={() => setReloadKey((value) => value + 1)}>Thử lại</button>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '48px 24px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--color-bg-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '8px' }}>Chưa có đơn hàng</h3>
          <p className="muted" style={{ marginBottom: '24px' }}>Khi bạn đặt hàng, thông tin đơn hàng sẽ hiển thị tại đây.</p>
          <button className="btn btn-outline" onClick={() => navigate('/')}>Bắt đầu mua sắm</button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {cancelError && (
          <p role="alert" style={{ color: '#B85042', fontSize: '0.92rem', marginBottom: '8px' }}>
            {cancelError}
          </p>
        )}
        {orders.map((order) => {
          const id = orderDisplayId(order);
          const status = orderStatus(order);
          const items = Array.isArray(order.items) ? order.items : [];
          const shippingLine = [order.shippingAddress, order.shippingCity].filter(Boolean).join(', ');
          const canCancel = !NON_CANCELLABLE.has(status);
          const isCancelling = cancellingId === (order.id ?? id);

          return (
            <article
              key={id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '20px',
                background: 'var(--color-bg)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>Đơn hàng #{id}</h3>
                  <p className="muted" style={{ fontSize: '0.9rem' }}>{orderDateLabel(order)} · {orderItemsCount(order)} sản phẩm</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: statusColor(status), fontWeight: 600, marginBottom: '6px' }}>
                    {translateStatus(status)}
                  </div>
                  <div style={{ fontWeight: 600 }}>{money(orderTotal(order))}</div>
                </div>
              </div>

              {items.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {items.slice(0, 4).map((item, index) => {
                    const product = productInfo(item);
                    const imageUrl = product.imageUrl || item.productImageUrl || item.imageUrl;
                    return (
                      <div key={`${id}-${product.id || index}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px', flex: '1 1 180px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--color-bg-soft)', overflow: 'hidden', flex: '0 0 auto' }}>
                          {imageUrl && (
                            <img src={imageUrl} alt={product.productName || product.name || 'Sản phẩm'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.92rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {product.productName || product.name || 'Sản phẩm'}
                          </div>
                          <div className="muted" style={{ fontSize: '0.82rem' }}>x{item.quantity || 1}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(order.shippingName || shippingLine || order.shippingPhone) && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', color: 'var(--color-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {order.shippingName && <div>Người nhận: {order.shippingName}</div>}
                  {order.shippingPhone && <div>Số điện thoại: {order.shippingPhone}</div>}
                  {shippingLine && <div>Giao đến: {shippingLine}</div>}
                </div>
              )}

              {canCancel && (
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                  <button
                    id={`cancel-order-${order.id ?? id}`}
                    className="btn btn-ghost"
                    style={{ color: '#B85042', fontSize: '0.88rem' }}
                    onClick={() => handleCancelOrder(order.id ?? id)}
                    disabled={isCancelling || loadingOrders}
                    aria-label={`Huỷ đơn hàng #${id}`}
                  >
                    {isCancelling ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="shell section-padding">
      <div className="grid-2" style={{ gridTemplateColumns: '1fr 2.5fr', gap: '32px', alignItems: 'start' }}>
        <div className="card" style={{ padding: '32px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 500, color: 'var(--color-wood)', marginBottom: '16px' }}>
              {initials(user.userName)}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 500 }}>{user.userName}</h2>
            <p className="muted" style={{ fontSize: '0.9rem' }}>Thành viên từ năm 2026</p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} aria-label="Điều hướng tài khoản">
            <button className="btn" style={{ justifyContent: 'flex-start', background: 'var(--color-bg-soft)', fontWeight: 500 }}>Đơn hàng của tôi</button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>Địa chỉ đã lưu</button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>Cài đặt tài khoản</button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: '#B85042', marginTop: '16px' }} onClick={() => { logout(); navigate('/'); }}>Đăng xuất</button>
          </nav>
        </div>

        <section className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Lịch sử đơn hàng</h2>
            <button className="btn btn-outline" onClick={() => setReloadKey((value) => value + 1)} disabled={loadingOrders}>
              Làm mới
            </button>
          </div>

          {renderOrders()}
        </section>
      </div>
    </div>
  );
}
