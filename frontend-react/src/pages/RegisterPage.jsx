import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { post } from '../api/client.js';
import { ENDPOINTS } from '../api/endpoints.js';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError(t('auth.password_mismatch'));
      return;
    }
    setLoading(true);
    try {
      await post(ENDPOINTS.register, {
        userName: form.username,
        email: form.email,
        userPassword: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (requestError) {
      setError(requestError?.status === 409 ? t('auth.email_in_use') : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-display)' }}>{t('auth.register_success')}</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>{t('common.loading')}</p>
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
            {t('auth.register')}
          </h1>
        </div>

        {error && (
          <div style={{ background: '#fff0f0', color: '#c0392b', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { id: 'reg-username', key: 'username', type: 'text', label: t('auth.username'), placeholder: t('auth.username_placeholder'), autoComplete: 'username' },
            { id: 'reg-email', key: 'email', type: 'email', label: t('auth.email'), placeholder: t('auth.email_placeholder'), autoComplete: 'email' },
            { id: 'reg-password', key: 'password', type: 'password', label: t('auth.password'), placeholder: t('auth.password_placeholder'), autoComplete: 'new-password' },
            { id: 'reg-confirm', key: 'confirmPassword', type: 'password', label: t('auth.confirm_password'), placeholder: t('auth.password_placeholder'), autoComplete: 'new-password' },
          ].map(field => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>{field.label}</label>
              <input
                id={field.id}
                type={field.type}
                value={form[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '8px',
                  border: '1.5px solid var(--color-border)', fontSize: '0.95rem',
                  background: 'var(--color-bg)', boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>
          ))}

          <button id="register-submit" type="submit" disabled={loading} className="btn btn-primary"
            style={{ padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '10px', marginTop: '8px' }}>
            {loading ? t('common.loading') : t('auth.register')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {t('auth.have_account')}{' '}
          <button onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
            {t('auth.login')}
          </button>
        </p>
      </div>
    </div>
  );
}
