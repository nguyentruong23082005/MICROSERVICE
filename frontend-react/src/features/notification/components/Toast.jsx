import { motion } from 'motion/react';

const ICONS = {
  success: '✓',
  error: '!',
  info: 'i',
};

export default function Toast({ toast, onDismiss }) {
  return (
    <motion.div
      className={`toast toast--${toast.type}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, x: 28, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 18, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    >
      <span className="toast__icon" aria-hidden="true">{ICONS[toast.type] || ICONS.info}</span>
      <p className="toast__message">{toast.message}</p>
      <button
        id={`dismiss-toast-${toast.id}`}
        type="button"
        className="toast__dismiss"
        onClick={() => onDismiss(toast.id)}
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </motion.div>
  );
}