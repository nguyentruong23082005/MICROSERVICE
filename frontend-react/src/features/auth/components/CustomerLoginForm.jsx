import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getLoginDestination } from '../authNavigation.js';
import SocialAuthButtons from './SocialAuthButtons.jsx';

export default function CustomerLoginForm({ requestedPath, onClose, onSwitchMode }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameReadOnly, setUsernameReadOnly] = useState(true);
  const [passwordReadOnly, setPasswordReadOnly] = useState(true);

  const updateValue = (key) => (event) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(values.username.trim(), values.password);
      const destination = getLoginDestination({ role: user.role, requestedPath });
      onClose?.();
      navigate(destination, { replace: true });
    } catch {
      setError(t('auth.login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate autoComplete="off">
      {error && <div className="auth-alert auth-alert--error" role="alert">{error}</div>}
      <div className="auth-field">
        <label htmlFor="customer-login-username">{t('auth.username')}</label>
        <input id="customer-login-username" name="username" type="text" value={values.username}
          onChange={updateValue('username')} placeholder={t('auth.username_placeholder')}
          autoComplete="off" required 
          readOnly={usernameReadOnly}
          onFocus={() => setUsernameReadOnly(false)} />
      </div>
      <div className="auth-field">
        <div className="auth-field__label-row">
          <label htmlFor="customer-login-password">{t('auth.password')}</label>
          <button className="auth-text-button" type="button" onClick={() => navigate('/forgot-password', { replace: true })}>
            {t('auth.forgot_password')}
          </button>
        </div>
        <div className="auth-password-control">
          <input id="customer-login-password" name="password" type={showPassword ? 'text' : 'password'}
            value={values.password} onChange={updateValue('password')}
            placeholder={t('auth.password_placeholder')} autoComplete="off" required
            readOnly={passwordReadOnly}
            onFocus={() => setPasswordReadOnly(false)} />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)}
            aria-label={t(showPassword ? 'auth.hide_password' : 'auth.show_password')}>
            {t(showPassword ? 'auth.hide' : 'auth.show')}
          </button>
        </div>
      </div>
      <button id="customer-login-submit" className="btn btn-primary auth-submit" type="submit" disabled={loading}>
        {loading ? t('auth.signing_in') : t('auth.login')}
      </button>
      <SocialAuthButtons requestedPath={requestedPath} onAuthenticated={onClose} />
      <p className="auth-form__switch">
        {t('auth.no_account')}{' '}
        <button type="button" onClick={() => onSwitchMode('register')}>{t('auth.create_account')}</button>
      </p>
    </form>
  );
}
