import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from '../../../components/icons/index.js';
import CustomerLoginForm from './CustomerLoginForm.jsx';
import CustomerRegisterForm from './CustomerRegisterForm.jsx';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export default function AuthModal({ mode = 'login', requestedPath, onClose, onSwitchMode }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const titleKey = mode === 'register' ? 'auth.join_furniq' : 'auth.welcome_back';

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;
    document.body.style.overflow = 'hidden';
    dialog?.querySelector(FOCUSABLE)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = [...dialog.querySelectorAll(FOCUSABLE)];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="auth-modal" data-mode={mode}>
      <button className="auth-modal__backdrop" type="button" onClick={onClose} aria-label={t('auth.close_dialog')} />
      <section ref={dialogRef} className="auth-modal__panel" role="dialog" aria-modal="true"
        aria-labelledby="auth-modal-title" aria-describedby="auth-modal-description">
        <aside className="auth-modal__story" aria-hidden="true">
          <span className="auth-modal__monogram">F</span>
        </aside>

        <div className="auth-modal__content">
          <button id="auth-modal-close" className="auth-modal__close" type="button" onClick={onClose}
            aria-label={t('auth.close_dialog')}>
            <XIcon size={20} />
          </button>
          <header className="auth-modal__header">
            <span className="auth-modal__brand">Furniq</span>
            <h2 id="auth-modal-title">{t(titleKey)}</h2>
            <p id="auth-modal-description">
              {t(mode === 'register' ? 'auth.register_description' : 'auth.login_description')}
            </p>
          </header>
          {mode === 'register' ? (
            <CustomerRegisterForm onSwitchMode={onSwitchMode} />
          ) : (
            <CustomerLoginForm requestedPath={requestedPath} onClose={onClose} onSwitchMode={onSwitchMode} />
          )}
        </div>
      </section>
    </div>
  );
}
