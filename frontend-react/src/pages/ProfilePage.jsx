import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { money, initials } from '../utils/formatters.js';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  if (!user) {
    navigate('/');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="shell" style={{ padding: '32px 0 60px' }}>
      <div className="section-head">
        <div>
          <p className="eyebrow">Tài khoản</p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>Hồ sơ</h1>
        </div>
      </div>

      <div className="checkout-grid">
        {/* Profile card */}
        <div className="panel">
          <div className="profile-header">
            <div className="profile-avatar">
              {initials(user.userName)}
            </div>
            <div>
              <h2 style={{ marginBottom: 4 }}>{user.userName}</h2>
              <p className="muted" style={{ fontSize: '.85rem' }}>
                {user.role === 'ROLE_ADMIN' ? '👑 Quản trị viên' : '👤 Thành viên'}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
            <div className="flex justify-between">
              <span className="muted">User ID</span>
              <strong>#{user.userId}</strong>
            </div>
            <div className="flex justify-between">
              <span className="muted">Username</span>
              <strong>{user.userName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="muted">Vai trò</span>
              <strong>{user.role}</strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          {/* Cart summary */}
          <div className="panel" style={{ background: 'var(--surface-soft)' }}>
            <p className="eyebrow">Giỏ hàng hiện tại</p>
            <div className="flex justify-between items-center">
              <strong style={{ fontSize: '2rem' }}>{totalItems}</strong>
              <span className="muted">sản phẩm</span>
            </div>
            <div className="flex justify-between">
              <span>Tổng dự kiến</span>
              <strong className="price">{money(totalPrice)}</strong>
            </div>
            <button className="btn btn-primary btn-full mt-2" onClick={() => navigate('/cart')}>
              Xem giỏ hàng
            </button>
          </div>

          {/* Admin shortcut */}
          {user.role === 'ROLE_ADMIN' && (
            <div className="panel" style={{ background: 'var(--primary)', color: '#fff' }}>
              <p className="eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>Quản trị</p>
              <h3 style={{ color: '#fff', marginBottom: 12 }}>Admin Dashboard</h3>
              <button
                id="go-admin-btn"
                className="btn btn-secondary-on-dark btn-full"
                onClick={() => navigate('/admin')}
              >
                Mở Admin →
              </button>
            </div>
          )}

          <button
            id="logout-profile-btn"
            className="btn btn-danger btn-full"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
