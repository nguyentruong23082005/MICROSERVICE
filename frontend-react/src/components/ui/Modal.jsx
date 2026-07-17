export default function Modal({ title, children, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="neo-modal" role="presentation" onMouseDown={onClose}>
      <section className="neo-modal__panel" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="neo-modal__header">
          <h2>{title}</h2>
          <button className="neo-modal__close neo-focus" type="button" onClick={onClose} aria-label="Đóng hộp thoại">×</button>
        </header>
        {children}
      </section>
    </div>
  );
}
