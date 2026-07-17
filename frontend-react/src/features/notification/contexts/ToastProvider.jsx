import { useCallback, useMemo, useReducer } from 'react';
import { AnimatePresence } from 'motion/react';
import ToastContext from './ToastContext.js';
import Toast from '../components/Toast.jsx';
import { toastReducer } from '../utils/notificationState.js';

const DEFAULT_DURATION = 4200;

export default function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const dismiss = useCallback((id) => {
    dispatch({ type: 'remove', id });
  }, []);

  const showToast = useCallback((message, type = 'info', duration = DEFAULT_DURATION) => {
    const normalizedMessage = String(message || '').trim();
    if (!normalizedMessage) return null;

    const id = globalThis.crypto?.randomUUID?.()
      || `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    dispatch({ type: 'add', toast: { id, message: normalizedMessage, type } });

    if (duration > 0) {
      globalThis.setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({ showToast, dismiss }), [dismiss, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}