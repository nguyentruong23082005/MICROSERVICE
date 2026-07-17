import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { initials } from '../../../utils/formatters.js';
import { UnorderedListIcon } from '../../../components/icons/index.js';

export default function AdminHeader({ menuOpen = false, onMenuToggle }) {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();

  const titleMap = [
    ['/products', t('admin.products')],
    ['/categories', t('admin.categories')],
    ['/inventory', t('admin.inventory')],
    ['/orders', t('admin.orders')],
    ['/users', t('admin.customers')],
    ['/payments', t('admin.payment_transactions')],
    ['/notifications', t('admin.notifications')],
    ['/coupons', t('admin.coupons')],
    ['/reviews', t('admin.reviews')],
    ['/content', t('admin.content')],
  ];
  const matchedTitle = titleMap.find(([path]) => location.pathname.includes(path));
  const title = matchedTitle?.[1] || t('admin.overview');

  return (
    <header className="admin-header-bar">
      <div className="admin-header-left">
        <button
          id="admin-menu-toggle"
          className="admin-header-icon-btn admin-menu-toggle"
          type="button"
          aria-controls="admin-sidebar"
          aria-expanded={menuOpen}
          aria-label="Mở menu quản trị"
          onClick={onMenuToggle}
        >
          <UnorderedListIcon size={20} />
        </button>
        <div>
          <span className="admin-header-kicker">Furniq Commerce</span>
          <h2 className="admin-page-title-small">{title}</h2>
        </div>
      </div>

      <div className="admin-header-actions">
        <div className="admin-user-pill">
          <div className="admin-avatar">{initials(user?.userName || 'A')}</div>
          <span className="admin-user-copy">
            <strong>{user?.userName || t('admin.administrator')}</strong>
            <small>Quản trị viên</small>
          </span>
        </div>
      </div>
    </header>
  );
}
