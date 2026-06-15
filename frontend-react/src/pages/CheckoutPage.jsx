import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { createOrder } from '../services/orderService.js';
import { money, formatDate } from '../utils/formatters.js';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, cartId, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!user) {
    return (
      <div className="shell mt-3">
        <div className="empty-state">
          <h2>Vui lòng đăng nhập</h2>
          <p className="muted">Cần đăng nhập để đặt hàng.</p>
          <button className="btn btn-primary mt-2" onClick={() => navigate('/')}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const handleOrder = async () => {
    if (!cartId || items.length === 0) {
      setError('Giỏ hàng trống hoặc không tìm thấy cartId.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const order = await createOrder(user.userId, cartId);
      setResult(order);
      clearCart();
    } catch (err) {
      setError(err.message || 'Đặt hàng thất bại. Kiểm tra backend services.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (result) {
    return (
      <div className="shell" style={{ padding: '40px 0 60px' }}>
        <div className="panel" style={{ maxWidth: 640, margin: 'auto', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, background: 'var(--primary)',
            display: 'grid', placeItems: 'center', margin: '0 auto 20px', fontSize: '2rem', color: '#fff',
          }}>✓</div>
          <p className="eyebrow">Đặt hàng thành công</p>
          <h2>Đơn hàng #{result.id}</h2>

          <div style={{ margin: '24px 0', borderTop: '1px solid var(--line)', paddingTop: 20 }}>
            <div className="flex justify-between mb-1">
              <span className="muted">Khách hàng</span>
              <strong>{result.user?.userName || user.userName}</strong>
            </div>
            <div className="flex justify-between mb-1">
              <span className="muted">Ngày đặt</span>
              <strong>{formatDate(result.orderedDate)}</strong>
            </div>
            <div className="flex justify-between mb-1">
              <span className="muted">Trạng thái</span>
              <strong style={{ color: 'var(--primary)' }}>{result.status}</strong>
            </div>
            <div className="flex justify-between">
              <span className="muted">Tổng tiền</span>
              <strong className="price">{money(result.total)}</strong>
            </div>
          </div>

          {/* Items */}
          {Array.isArray(result.items) && result.items.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: 20 }}>
              <h3 style={{ marginBottom: 12, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                Sản phẩm đã đặt
              </h3>
              {result.items.map((item, idx) => (
                <div key={idx} className="flex justify-between" style={{
                  padding: '10px 0', borderBottom: '1px solid var(--line)', fontWeight: 800,
                }}>
                  <span>{item.product?.productName || item.productName || `Sản phẩm #${item.productId}`}</span>
                  <span>×{item.quantity} → <span className="price">{money(item.subTotal)}</span></span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-sm" style={{ justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              Tiếp tục mua sắm
            </button>
            <button className="btn btn-ghost" onClick={() => setResult(null)}>
              Xem lại đơn
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell" style={{ padding: '32px 0 60px' }}>
      <div className="section-head">
        <div>
          <p className="eyebrow">Xác nhận</p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>Đặt hàng</h1>
        </div>
      </div>

      <div className="checkout-grid">
        {/* Order summary */}
        <div className="panel">
          <p className="eyebrow">Tóm tắt đơn hàng</p>
          <h2 style={{ marginBottom: 16 }}>Sản phẩm ({items.length})</h2>

          <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontWeight: 800 }}>
                <span>{item.productName || `Product #${item.productId}`}</span>
                <span>×{item.quantity} <span className="price">{money(item.subTotal || (item.productPrice * item.quantity))}</span></span>
              </div>
            ))}
          </div>

          <div className="cart-total" style={{ marginTop: 0 }}>
            <span>Tổng cộng</span>
            <strong className="price" style={{ fontSize: '1.4rem' }}>{money(totalPrice)}</strong>
          </div>
        </div>

        {/* Place order */}
        <div className="panel">
          <p className="eyebrow">Thông tin</p>
          <h2 style={{ marginBottom: 20 }}>Xác nhận đặt hàng</h2>

          <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
            <div className="flex justify-between">
              <span className="muted">Tài khoản</span>
              <strong>{user.userName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="muted">User ID</span>
              <strong>#{user.userId}</strong>
            </div>
            {cartId && (
              <div className="flex justify-between">
                <span className="muted">Cart ID</span>
                <code style={{ fontSize: '.78rem' }}>{cartId}</code>
              </div>
            )}
          </div>

          {error && (
            <div className="toast toast-error" style={{ position: 'static', marginBottom: 16, animation: 'none' }}>
              {error}
            </div>
          )}

          {items.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 100 }}>
              <p className="muted">Giỏ hàng trống</p>
            </div>
          ) : (
            <button
              id="place-order-btn"
              className="btn btn-primary btn-full"
              onClick={handleOrder}
              disabled={loading}
            >
              {loading ? 'Đang đặt hàng…' : `Đặt hàng — ${money(totalPrice)}`}
            </button>
          )}

          <p className="muted mt-2" style={{ fontSize: '.82rem', textAlign: 'center' }}>
            Đơn hàng sẽ publish sự kiện Kafka → Notification Service
          </p>
        </div>
      </div>
    </div>
  );
}
