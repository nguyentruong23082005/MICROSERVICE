import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import {
  getLoginDestination,
  getRequestedPath,
} from '../features/auth/authNavigation.js';
import { signInWithFacebook, signInWithGoogle } from '../utils/firebase.js';

export default function LoginPage({ adminOnly = false }) {
  const { t } = useTranslation();
  const { login, firebaseLogin, adminLogin, adminLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (adminOnly) {
        // Use dedicated admin session
        const authenticatedUser = await adminLogin(form.identifier.trim(), form.password);
        if (authenticatedUser.role !== 'ROLE_ADMIN') {
          await adminLogout();
          setError(t('auth.admin_access_denied'));
          return;
        }
        navigate(getLoginDestination({
          role: authenticatedUser.role,
          requestedPath: getRequestedPath(location.state),
        }), { replace: true });
      } else {
        // Customer login
        const authenticatedUser = await login(form.identifier.trim(), form.password);
        navigate(getLoginDestination({
          role: authenticatedUser.role,
          requestedPath: getRequestedPath(location.state),
        }), { replace: true });
      }
    } catch {
      setError(t('auth.login_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerName, signIn) => {
    setError('');
    setSocialLoading(providerName);
    try {
      const { idToken } = await signIn();
      const authenticatedUser = await firebaseLogin(idToken);
      navigate(getLoginDestination({
        role: authenticatedUser.role,
        requestedPath: getRequestedPath(location.state),
      }), { replace: true });
    } catch (socialError) {
      if (socialError?.code !== 'auth/popup-closed-by-user') {
        setError(t('auth.login_failed'));
      }
    } finally {
      setSocialLoading('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'var(--color-surface)',
        borderRadius: '16px',
        padding: '48px 40px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
            {t(adminOnly ? 'auth.admin_login' : 'auth.customer_login')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {adminOnly
              ? t('auth.admin_login_description')
              : `Furniq — ${t('auth.username')} & ${t('auth.password')}`}
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fff0f0', color: '#c0392b', borderRadius: '8px',
            padding: '12px 16px', marginBottom: '20px', fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="login-username" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              {t('auth.login_identifier')}
            </label>
            <input
              id="login-username"
              type="text"
              value={form.identifier}
              onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
              placeholder={t('auth.login_identifier_placeholder')}
              required
              autoComplete={adminOnly ? 'one-time-code' : 'username'}
              data-1p-ignore={adminOnly ? 'true' : undefined}
              data-lpignore={adminOnly ? 'true' : undefined}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '8px',
                border: '1.5px solid var(--color-border)', fontSize: '0.95rem',
                background: 'var(--color-bg)', boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label htmlFor="login-password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              {t('auth.password')}
            </label>
            <input
              id="login-password"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={t('auth.password_placeholder')}
              required
              autoComplete={adminOnly ? 'new-password' : 'current-password'}
              data-1p-ignore={adminOnly ? 'true' : undefined}
              data-lpignore={adminOnly ? 'true' : undefined}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '8px',
                border: '1.5px solid var(--color-border)', fontSize: '0.95rem',
                background: 'var(--color-bg)', boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ textAlign: 'right' }}>
            <button type="button" onClick={() => navigate('/forgot-password')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.875rem' }}>
              {t('auth.forgot_password')}
            </button>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '10px', marginTop: '8px' }}
          >
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>

        {!adminOnly && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
              <span style={{ padding: '0 12px', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                {t('common.or')}
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}></div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                disabled={!!socialLoading}
                onClick={() => handleSocialLogin('google', signInWithGoogle)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', background: '#fff', border: '1.5px solid var(--color-border)',
                  borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)',
                  cursor: socialLoading ? 'not-allowed' : 'pointer', opacity: socialLoading ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {socialLoading === 'google' ? (
                  <span>{t('common.loading')}</span>
                ) : (
                  <>
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '18px', height: '18px' }} />
                    Google
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={!!socialLoading}
                onClick={() => handleSocialLogin('facebook', signInWithFacebook)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', background: '#1877f2', border: 'none',
                  borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, color: '#fff',
                  cursor: socialLoading ? 'not-allowed' : 'pointer', opacity: socialLoading ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {socialLoading === 'facebook' ? (
                  <span>{t('common.loading')}</span>
                ) : (
                  <>
                    <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }} />
                    Facebook
                  </>
                )}
              </button>
            </div>

            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              {t('auth.no_account')}{' '}
              <button type="button" onClick={() => navigate('/register')}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
                {t('auth.register')}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
