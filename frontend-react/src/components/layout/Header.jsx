import { useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth.js';
import { useCart } from '../../features/cart/hooks/useCart.js';
import { useCompare } from '../../features/compare/index.js';
import LoginForm from '../../features/auth/components/LoginForm.jsx';
import RegisterForm from '../../features/auth/components/RegisterForm.jsx';
import LanguageSwitcher from '../ui/LanguageSwitcher.jsx';
import {
  UnorderedListIcon,
  MagnifierIcon,
  RefreshIcon,
  ShoppingCartIcon,
  UserIcon,
} from '../icons/index.js';

export default function Header() {
  const { user, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const { count: compareCount } = useCompare();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const goMobile = (path) => {
    navigate(path);
    setMobileMenu(false);
  };

  return (
    <>
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="desktop-only btn btn-ghost" style={{ display: 'none', padding: '8px' }} onClick={() => setMobileMenu(!mobileMenu)} aria-label="Mở menu điều hướng">
            <UnorderedListIcon size={24} />
          </button>

          <div className="brand" onClick={() => navigate('/')} role="link" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && navigate('/')}
            style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
            Furniq
          </div>
        </div>

        <nav className="nav-links desktop-only" style={{ display: 'flex', gap: '32px' }} aria-label="Điều hướng chính">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive && location.pathname === '/' ? 'muted' : ''}`} style={{ fontWeight: 500 }}>
            Trang chủ
          </NavLink>
          <NavLink to="/catalog" className="nav-link" style={{ fontWeight: 500 }}>
            Sản phẩm
          </NavLink>
          <NavLink to="/collections" className="nav-link" style={{ fontWeight: 500 }}>
            Bộ sưu tập
          </NavLink>
          <NavLink to="/about" className="nav-link" style={{ fontWeight: 500 }}>
            Giới thiệu
          </NavLink>
        </nav>

        <div className="flex items-center gap-sm">
          <button
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: '50%' }}
            aria-label="Tìm kiếm"
            onClick={() => navigate('/search')}
          >
            <MagnifierIcon size={20} strokeWidth={2} />
          </button>

          <button
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: '50%', position: 'relative' }}
            onClick={() => navigate('/compare')}
            aria-label={`So sánh sản phẩm (${compareCount})`}
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
            aria-label={`Giỏ hàng (${totalItems})`}
          >
            <ShoppingCartIcon size={20} strokeWidth={2} />
            {totalItems > 0 && (
              <span className="badge-count" style={{ position: 'absolute', top: 0, right: 0, background: 'var(--color-olive)', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-live="polite">{totalItems}</span>
            )}
          </button>

          {user ? (
            <button className="btn btn-ghost" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => navigate('/profile')} aria-label="Tài khoản">
              <UserIcon size={20} strokeWidth={2} />
            </button>
          ) : (
            <button id="login-btn" className="btn btn-primary btn-sm"
              onClick={() => setShowLogin(true)} style={{ marginLeft: '12px' }}>
              Tài khoản
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-outline btn-sm desktop-only" onClick={() => navigate('/admin')}>
              Quản trị
            </button>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      {mobileMenu && (
        <div style={{ position: 'fixed', top: '80px', left: 0, right: 0, bottom: 0, background: 'var(--color-bg)', zIndex: 90, padding: '24px' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '1.25rem' }} aria-label="Điều hướng di động">
            <span onClick={() => goMobile('/')}>Trang chủ</span>
            <span onClick={() => goMobile('/catalog')}>Sản phẩm</span>
            <span onClick={() => goMobile('/collections')}>Bộ sưu tập</span>
          </nav>
        </div>
      )}

      {showLogin && (
        <LoginForm
          onClose={() => setShowLogin(false)}
          onSwitch={() => { setShowLogin(false); setShowRegister(true); }}
        />
      )}
      {showRegister && (
        <RegisterForm
          onClose={() => setShowRegister(false)}
          onSwitch={() => { setShowRegister(false); setShowLogin(true); }}
        />
      )}
    </>
  );
}

