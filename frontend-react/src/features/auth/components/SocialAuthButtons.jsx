import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getLoginDestination } from '../authNavigation.js';
import { getSocialAuthErrorKey } from '../socialAuthErrors.js';
import { useAuth } from '../hooks/useAuth.js';
import { signInWithFacebook, signInWithGoogle } from '../../../utils/firebase.js';

const PROVIDERS = Object.freeze([
  Object.freeze({ id: 'customer-google-auth', name: 'google', label: 'Google', signIn: signInWithGoogle }),
  Object.freeze({ id: 'customer-facebook-auth', name: 'facebook', label: 'Facebook', signIn: signInWithFacebook }),
]);

function ProviderIcon({ provider }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.35l-3.24-2.55c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.63A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.44H3.04A10 10 0 0 0 2 12c0 1.64.39 3.2 1.04 4.56l3.35-2.63Z" />
        <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.44l3.35 2.63C7.18 7.7 9.39 5.94 12 5.94Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.03 3.66 9.2 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2V8.6h-1.25c-1.24 0-1.63.77-1.63 1.56v1.9h2.77l-.44 2.91h-2.33V22C18.34 21.25 22 17.09 22 12.06Z" />
    </svg>
  );
}

export default function SocialAuthButtons({ requestedPath, onAuthenticated }) {
  const { t } = useTranslation();
  const { firebaseLogin } = useAuth();
  const navigate = useNavigate();
  const [activeProvider, setActiveProvider] = useState('');
  const [error, setError] = useState('');

  const inFlightRef = useRef(false);

  const handleSocialLogin = async (provider) => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setError('');
    setActiveProvider(provider.name);
    try {
      const { idToken } = await provider.signIn();
      const user = await firebaseLogin(idToken);
      const destination = getLoginDestination({ role: user.role, requestedPath });
      onAuthenticated?.();
      navigate(destination, { replace: true });
    } catch (socialError) {
      const errorKey = getSocialAuthErrorKey(socialError);
      if (errorKey) setError(t(errorKey));
    } finally {
      inFlightRef.current = false;
      setActiveProvider('');
    }
  };

  return (
    <section className="auth-social" aria-label="Social authentication">
      <div className="auth-social__divider" aria-hidden="true"><span>{t('common.or')}</span></div>
      {error && <div className="auth-alert auth-alert--error" role="alert">{error}</div>}
      <div className="auth-social__buttons">
        {PROVIDERS.map((provider) => {
          const isLoading = activeProvider === provider.name;
          return (
            <button id={provider.id} className={`auth-social__button auth-social__button--${provider.name}`}
              type="button" disabled={Boolean(activeProvider)} onClick={() => handleSocialLogin(provider)}
              aria-label={`${t('auth.login')} ${provider.label}`} key={provider.name}>
              <ProviderIcon provider={provider.name} />
              <span>{isLoading ? t('common.loading') : provider.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
