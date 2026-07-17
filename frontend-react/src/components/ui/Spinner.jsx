export default function Spinner({ label = 'Đang tải...' }) {
  return (
    <div className="neo-spinner" role="status" aria-live="polite">
      <span className="neo-spinner__mark" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
