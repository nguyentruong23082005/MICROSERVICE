import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth.js';

export default function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="admin-sidebar">
      <div>
        <div className="admin-brand">
          <span style={{ fontWeight: 600 }}>A</span>
          <span>Quản trị</span>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin menu">
          <NavLink to="/admin" end className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
            Tổng quan
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
            Sản phẩm
          </NavLink>
          <NavLink to="/admin/categories" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
            Danh mục
          </NavLink>
          <NavLink to="/admin/inventory" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
            Kho hàng
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
            Đơn hàng
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
            Khách hàng
          </NavLink>
          <NavLink to="/admin/payments" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
            Giao dịch
          </NavLink>
          <NavLink to="/admin/coupons" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
            Mã giảm giá
          </NavLink>
          <NavLink to="/admin/reviews" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
            Đánh giá
          </NavLink>
          <NavLink to="/admin/content" className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}>
            Nội dung
          </NavLink>
        </nav>
      </div>

      <div className="admin-sidebar-footer">
        <button onClick={handleLogout} className="admin-logout-btn">
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
