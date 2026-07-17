export default function Badge({ children, className = '', tone = 'ink' }) {
  return <span className={`neo-badge neo-badge--${tone} ${className}`.trim()}>{children}</span>;
}
