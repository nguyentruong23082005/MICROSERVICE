export default function Button({ children, className = '', variant = 'primary', type = 'button', ...props }) {
  const variantClass = {
    primary: 'neo-button neo-button--primary',
    secondary: 'neo-button neo-button--secondary',
    danger: 'neo-button neo-button--danger',
    ghost: 'neo-button neo-button--ghost',
  }[variant] || 'neo-button neo-button--primary';

  return (
    <button type={type} className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
