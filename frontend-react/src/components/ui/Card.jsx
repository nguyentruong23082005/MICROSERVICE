export default function Card({ children, className = '', interactive = false, as: Component = 'article', ...props }) {
  const interactiveClass = interactive ? 'neo-interactive' : '';
  return (
    <Component className={`neo-card ${interactiveClass} ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
