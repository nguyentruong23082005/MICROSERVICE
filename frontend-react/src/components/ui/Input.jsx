export default function Input({ id, label, error, className = '', ...props }) {
  return (
    <div className={`neo-field ${className}`.trim()}>
      {label ? <label htmlFor={id}>{label}</label> : null}
      <input id={id} className="neo-input neo-focus" aria-invalid={error ? 'true' : 'false'} {...props} />
      {error ? <small className="neo-field__error">{error}</small> : null}
    </div>
  );
}
