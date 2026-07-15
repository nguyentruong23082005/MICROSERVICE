import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/hooks/useAuth.js';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch {
      setError(t('auth.login_failed'));
    } finally {
      setLoading(false);
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
            {t('auth.login')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Furniq — {t('auth.username')} & {t('auth.password')}
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              {t('auth.username')}
            </label>
            <input
              id="login-username"
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder={t('auth.username_placeholder')}
              required
              autoComplete="username"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '8px',
                border: '1.5px solid var(--color-border)', fontSize: '0.95rem',
                background: 'var(--color-bg)', boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              {t('auth.password')}
            </label>
            <input
              id="login-password"
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={t('auth.password_placeholder')}
              required
              autoComplete="current-password"
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

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {t('auth.no_account')}{' '}
          <button onClick={() => navigate('/register')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
            {t('auth.register')}
          </button>
        </p>
      </div>
    </div>
  );
}
