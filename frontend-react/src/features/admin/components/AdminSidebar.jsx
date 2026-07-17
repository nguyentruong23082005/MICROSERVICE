import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/hooks/useAuth.js';

const NAV_ITEMS = [
  { to: '/admin', end: true, labelKey: 'admin.overview', icon: 'bi-grid-1x2' },
  { to: '/admin/products', labelKey: 'admin.products', icon: 'bi-box-seam' },
  { to: '/admin/categories', labelKey: 'admin.categories', icon: 'bi-tags' },
  { to: '/admin/inventory', labelKey: 'admin.inventory', icon: 'bi-boxes' },
  { to: '/admin/orders', labelKey: 'admin.orders', icon: 'bi-receipt' },
  { to: '/admin/users', labelKey: 'admin.customers', icon: 'bi-people' },
  { to: '/admin/payments', labelKey: 'admin.transactions', icon: 'bi-credit-card' },
  { to: '/admin/notifications', labelKey: 'admin.notifications', icon: 'bi-bell' },
  { to: '/admin/chat', labelKey: 'admin.chat', icon: 'bi-chat-dots' },
  { to: '/admin/coupons', labelKey: 'admin.coupons', icon: 'bi-ticket-perforated' },
  { to: '/admin/reviews', labelKey: 'admin.reviews', icon: 'bi-star' },
  { to: '/admin/content', labelKey: 'admin.content', icon: 'bi-file-earmark-text' },
];

export default function AdminSidebar({ open = false, onNavigate }) {
  const { adminLogout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <aside className={`admin-sidebar ${open ? 'is-open' : ''}`} id="admin-sidebar">
      <div>
        <NavLink to="/admin" className="admin-brand" onClick={onNavigate} aria-label="Furniq Admin">
          <span className="admin-brand-mark">FQ</span>
          <span className="admin-brand-copy">
            <strong>Furniq</strong>
            <small>Admin Console</small>
          </span>
        </NavLink>

        <span className="admin-nav-label">{t('admin.store_management')}</span>
        <nav className="admin-sidebar-nav" aria-label={t('admin.menu_label')}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <i className={`bi ${item.icon} admin-sidebar-icon`} aria-hidden="true" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="admin-sidebar-footer">
        <NavLink to="/" className="admin-store-link" onClick={onNavigate}>
          {t('admin.view_store')}
        </NavLink>
        <button id="admin-logout-button" onClick={handleLogout} className="admin-logout-btn">
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
