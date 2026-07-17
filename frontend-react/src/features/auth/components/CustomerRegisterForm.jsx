import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth.js';
import { validateRegistration } from '../authValidation.js';
import SocialAuthButtons from './SocialAuthButtons.jsx';

const INITIAL_VALUES = { username: '', email: '', password: '', confirmPassword: '' };

export default function CustomerRegisterForm({ onSwitchMode }) {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldsReadOnly, setFieldsReadOnly] = useState({
    username: true,
    email: true,
    password: true,
    confirmPassword: true,
  });

  const updateValue = (key) => (event) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateRegistration(values);
    setErrors(validationErrors);
    setServerError('');
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await register({ userName: values.username.trim(), email: values.email.trim(), userPassword: values.password });
      setSuccess(true);
    } catch (error) {
      setServerError(
        error?.status === 409
          ? t('auth.email_in_use')
          : error?.message || t('auth.register_failed')
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-success" role="status">
        <span className="auth-success__mark" aria-hidden="true">✓</span>
        <h3>{t('auth.register_success')}</h3>
        <p>{t('auth.register_success_description')}</p>
        <button className="btn btn-primary auth-submit" type="button" onClick={() => onSwitchMode('login')}>
          {t('auth.continue_to_login')}
        </button>
      </div>
    );
  }

  const fields = [
    { key: 'username', type: 'text', autoComplete: 'off' },
    { key: 'email', type: 'email', autoComplete: 'off' },
    { key: 'password', type: showPassword ? 'text' : 'password', autoComplete: 'new-password' },
    { key: 'confirmPassword', type: showPassword ? 'text' : 'password', autoComplete: 'new-password' },
  ];

  return (
    <form className="auth-form auth-form--register" onSubmit={handleSubmit} noValidate autoComplete="off">
      {serverError && <div className="auth-alert auth-alert--error" role="alert">{serverError}</div>}
      <div className="auth-form__grid">
        {fields.map((field) => {
          const translationKey = field.key === 'confirmPassword' ? 'confirm_password' : field.key;
          const inputId = `customer-register-${field.key}`;
          return (
            <div className={`auth-field auth-field--${field.key}`} key={field.key}>
              <label htmlFor={inputId}>{t(`auth.${translationKey}`)}</label>
              <input id={inputId} name={field.key} type={field.type} value={values[field.key]}
                onChange={updateValue(field.key)} autoComplete={field.autoComplete}
                placeholder={t(`auth.${translationKey}_placeholder`, { defaultValue: t('auth.password_placeholder') })}
                aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? `${inputId}-error` : undefined}
                required={field.key !== 'email' ? true : undefined}
                readOnly={fieldsReadOnly[field.key]}
                onFocus={() => setFieldsReadOnly(prev => ({ ...prev, [field.key]: false }))} />
              {errors[field.key] && <span id={`${inputId}-error`} className="auth-field__error">{t(`auth.${errors[field.key]}`)}</span>}
            </div>
          );
        })}
      </div>
      <label className="auth-password-toggle">
        <input type="checkbox" checked={showPassword} onChange={() => setShowPassword((visible) => !visible)} />
        <span>{t('auth.show_password')}</span>
      </label>
      <button id="customer-register-submit" className="btn btn-primary auth-submit" type="submit" disabled={loading}>
        {loading ? t('auth.creating_account') : t('auth.create_account')}
      </button>
      <SocialAuthButtons />
      <p className="auth-form__switch">
        {t('auth.have_account')}{' '}
        <button type="button" onClick={() => onSwitchMode('login')}>{t('auth.login')}</button>
      </p>
    </form>
  );
}
