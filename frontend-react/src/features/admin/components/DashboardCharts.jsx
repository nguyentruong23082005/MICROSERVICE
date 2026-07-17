import { money } from '../../../utils/formatters.js';

const STATUS_META = [
  { key: 'CREATED', label: 'Chờ xử lý', className: 'created' },
  { key: 'PAID', label: 'Đã thanh toán', className: 'paid' },
  { key: 'DELIVERED', label: 'Đã giao', className: 'delivered' },
  { key: 'CANCELLED', label: 'Đã hủy', className: 'cancelled' },
  { key: 'OTHER', label: 'Khác', className: 'other' },
];

function shortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
}

export function RevenueChart({ series = [] }) {
  if (series.length === 0) {
    return <div className="admin-chart-empty" role="status">Chưa có dữ liệu doanh thu theo ngày.</div>;
  }

  const width = 760;
  const height = 260;
  const padding = { top: 20, right: 18, bottom: 42, left: 18 };
  const maxValue = Math.max(...series.map((item) => item.value), 1);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const points = series.map((item, index) => ({
    ...item,
    x: padding.left + (series.length === 1 ? chartWidth / 2 : (index / (series.length - 1)) * chartWidth),
    y: padding.top + chartHeight - (item.value / maxValue) * chartHeight,
  }));
  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(' ');

  return (
    <div className="admin-revenue-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="revenue-chart-title revenue-chart-desc">
        <title id="revenue-chart-title">Biểu đồ doanh thu theo ngày</title>
        <desc id="revenue-chart-desc">Doanh thu thực tế của {series.length} ngày có giao dịch.</desc>
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            className="admin-chart-gridline"
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + chartHeight * ratio}
            y2={padding.top + chartHeight * ratio}
          />
        ))}
        <polyline className="admin-chart-line" points={linePoints} />
        {points.map((point) => (
          <g key={point.date} className="admin-chart-point">
            <circle cx={point.x} cy={point.y} r="6" tabIndex="0">
              <title>{shortDate(point.date)}: {money(point.value)}</title>
            </circle>
            <text x={point.x} y={height - 14} textAnchor="middle">{shortDate(point.date)}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function OrderStatusChart({ counts = {} }) {
  const values = STATUS_META.map((status) => ({ ...status, value: Number(counts[status.key] || 0) }));
  const total = values.reduce((sum, status) => sum + status.value, 0);

  if (total === 0) {
    return <div className="admin-chart-empty" role="status">Chưa có đơn hàng để phân tích.</div>;
  }

  return (
    <div className="admin-status-chart" role="img" aria-label={`Phân bổ ${total} đơn hàng theo trạng thái`}>
      {values.map((status) => (
        <div className="admin-status-chart__row" key={status.key}>
          <div className="admin-status-chart__label">
            <span>{status.label}</span>
            <strong>{status.value}</strong>
          </div>
          <div className="admin-status-chart__track" aria-hidden="true">
            <span
              className={`admin-status-chart__bar admin-status-chart__bar--${status.className}`}
              style={{ width: `${(status.value / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
