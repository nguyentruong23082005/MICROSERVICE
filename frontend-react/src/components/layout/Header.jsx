import { useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth/hooks/useAuth.js';
import { useCart } from '../../features/cart/hooks/useCart.js';
import { useCompare } from '../../features/compare/index.js';
import { NotificationDropdown } from '../../features/notification/index.js';
import LanguageSwitcher from '../ui/LanguageSwitcher.jsx';
import {
  UnorderedListIcon,
  MagnifierIcon,
  RefreshIcon,
  ShoppingCartIcon,
  UserIcon,
} from '../icons/index.js';

export default function Header() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const { count: compareCount } = useCompare();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);

  const goMobile = (path) => {
    navigate(path);
    setMobileMenu(false);
  };

  return (
    <>
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="desktop-only btn btn-ghost" style={{ display: 'none', padding: '8px' }} onClick={() => setMobileMenu(!mobileMenu)} aria-label={t('nav.open_menu')}>
            <UnorderedListIcon size={24} />
          </button>

          <div className="brand" onClick={() => navigate('/')} role="link" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate('/')}
            style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
            Furniq
          </div>
        </div>

        <nav className="nav-links desktop-only" style={{ display: 'flex', gap: '32px', alignItems: 'center' }} aria-label={t('nav.primary_navigation')}>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive && location.pathname === '/' ? 'muted' : ''}`} style={{ fontWeight: 500 }}>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/catalog" className="nav-link" style={{ fontWeight: 500 }}>
            {t('nav.products')}
          </NavLink>
          <NavLink to="/collections" className="nav-link" style={{ fontWeight: 500 }}>
            {t('nav.collections')}
          </NavLink>
          <NavLink to="/about" className="nav-link" style={{ fontWeight: 500 }}>
            {t('nav.about')}
          </NavLink>
          <NavLink to="/contact" className="nav-link" style={{ fontWeight: 500 }}>
            {t('nav.contact')}
          </NavLink>
        </nav>

        <div className="flex items-center gap-sm">
          <button
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: '50%' }}
            aria-label={t('nav.search')}
            onClick={() => navigate('/search')}
          >
            <MagnifierIcon size={20} strokeWidth={2} />
          </button>

          <button
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: '50%', position: 'relative' }}
            onClick={() => navigate('/compare')}
            aria-label={t('nav.compare_count', { count: compareCount })}
          >
            <RefreshIcon size={20} strokeWidth={2} />
            {compareCount > 0 && (
              <span className="badge-count" style={{ position: 'absolute', top: 0, right: 0, background: 'var(--color-wood)', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-live="polite">{compareCount}</span>
            )}
          </button>

          <button
            id="cart-btn"
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: '50%', position: 'relative' }}
            onClick={() => navigate('/cart')}
            aria-label={t('nav.cart_count', { count: totalItems })}
          >
            <ShoppingCartIcon size={20} strokeWidth={2} />
            {totalItems > 0 && (
              <span className="badge-count" style={{ position: 'absolute', top: 0, right: 0, background: 'var(--color-olive)', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-live="polite">{totalItems}</span>
            )}
          </button>

          {user && <NotificationDropdown userId={user.userId} />}

          {user ? (
            <button className="btn btn-ghost" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => navigate('/profile')} aria-label={t('nav.account')}>
              <UserIcon size={20} strokeWidth={2} />
            </button>
          ) : (
            <button
              id="login-btn"
              className="btn btn-primary btn-sm"
              aria-haspopup="dialog"
              aria-expanded={location.pathname === '/login' || location.pathname === '/register'}
              onClick={() => navigate('/login', { state: { backgroundLocation: location } })}
              style={{ marginLeft: '12px' }}
            >
              {t('nav.account')}
            </button>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      {mobileMenu && (
        <div style={{ position: 'fixed', top: '80px', left: 0, right: 0, bottom: 0, background: 'var(--color-bg)', zIndex: 90, padding: '24px' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '1.25rem' }} aria-label={t('nav.mobile_navigation')}>
            <span onClick={() => goMobile('/')}>{t('nav.home')}</span>
            <span onClick={() => goMobile('/catalog')}>{t('nav.products')}</span>
            <span onClick={() => goMobile('/collections')}>{t('nav.collections')}</span>
          </nav>
        </div>
      )}

    </>
  );
}

