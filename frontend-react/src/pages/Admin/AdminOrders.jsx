export default function AdminOrders() {
  return (
    <div className="panel">
      <p className="eyebrow">Quản lý</p>
      <h2 style={{ marginBottom: 12 }}>Đơn hàng</h2>
      <p className="muted">
        Order Service lưu đơn hàng trong PostgreSQL. Endpoint GET /api/shop/orders
        sẽ được hiển thị tại đây khi Order Service expose API đó.
      </p>
      <div style={{ marginTop: 20, padding: 20, background: 'var(--surface-soft)', border: '1px solid var(--line)' }}>
        <strong>Tip:</strong> Dùng Kafka consumer log hoặc Notification Service
        để xem sự kiện đơn hàng real-time.
      </div>
    </div>
  );
}
