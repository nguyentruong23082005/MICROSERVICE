import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO Phase 8.6 backend: POST /api/accounts/auth/forgot-password
    await new Promise(r => setTimeout(r, 800)); // simulate request
    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📧</div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>{t('auth.reset_email_sent')}</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>{email}</p>
          <button className="btn btn-outline" onClick={() => navigate('/login')}>{t('auth.login')}</button>
        </div>
      </div>
    );
  }

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
            {t('auth.forgot_password')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {t('auth.email_placeholder')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              {t('auth.email')}
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('auth.email_placeholder')}
              required
              autoComplete="email"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '8px',
                border: '1.5px solid var(--color-border)', fontSize: '0.95rem',
                background: 'var(--color-bg)', boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>

          <button id="forgot-submit" type="submit" disabled={loading} className="btn btn-primary"
            style={{ padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '10px', marginTop: '8px' }}>
            {loading ? t('common.loading') : t('auth.send_reset_email')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem' }}>
          <button onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
            ← {t('auth.login')}
          </button>
        </p>
      </div>
    </div>
  );
}
