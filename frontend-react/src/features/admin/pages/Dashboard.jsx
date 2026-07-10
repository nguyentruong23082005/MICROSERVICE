import { useState, useEffect } from 'react';
import { adminGetProducts, adminGetUsers, adminGetOrders } from '../services/adminService.js';
import { usePayment } from '../../payment/index.js';
import { useNotification } from '../../notification/index.js';
import { money } from '../../../utils/formatters.js';
import { translateStatus } from '../../../utils/uiText.js';
import {
  orderCustomerName,
  orderDateLabel,
  orderDisplayId,
  orderStatus,
  orderTotal,
} from '../../orders/utils/orderViewModel.js';

const LOW_STOCK_THRESHOLD = 5;

function countByStatus(orders) {
  const counts = {};
  orders.forEach((o) => {
    const s = orderStatus(o);
    counts[s] = (counts[s] || 0) + 1;
  });
  return counts;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, users: 0, categories: 0, stock: 0, lowStock: 0 });
  const { revenue, fetchRevenue } = usePayment();
  const { notifications, fetchAdminNotifications } = useNotification();
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      fetchRevenue();
      fetchAdminNotifications();
      Promise.all([adminGetProducts(), adminGetUsers(), adminGetOrders().catch(() => [])])
        .then(([products, users, orders]) => {
          if (!active) return;
          const productList = Array.isArray(products) ? products : [];
          const userList = Array.isArray(users) ? users : [];
          const categories = new Set(productList.map((product) => product.category).filter(Boolean));
          const stock = productList.reduce((total, product) => total + Number(product.availability || 0), 0);
          const lowStock = productList.filter((p) => Number(p.availability || 0) <= LOW_STOCK_THRESHOLD).length;

          const orderList = Array.isArray(orders) ? orders : [];

          setRecentOrders(orderList.slice(0, 5));
          setStatusCounts(countByStatus(orderList));
          setStats({
            products: productList.length,
            users: userList.length,
            categories: categories.size,
            stock,
            lowStock,
          });
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });
    return () => { active = false; };
  }, [fetchRevenue, fetchAdminNotifications]);

  const STATUS_DISPLAY = [
    { key: 'CREATED', label: 'Chờ xử lý', color: 'var(--admin-muted)' },
    { key: 'PAID', label: 'Đã thanh toán', color: '#4a90d9' },
    { key: 'DELIVERED', label: 'Đã giao', color: 'var(--admin-mint-text, #2d6a4f)' },
    { key: 'CANCELLED', label: 'Đã huỷ', color: 'var(--admin-danger-text, #B85042)' },
  ];


  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Tổng quan</h1>
          <p className="admin-subtitle">Xem nhanh hiệu quả hoạt động của cửa hàng Furniq.</p>
        </div>
        <button className="admin-btn admin-btn-primary">Tải báo cáo</button>
      </div>

      <div className="admin-stats">
        <div className="metric-card highlight">
          <span className="metric-label">Tổng doanh thu</span>
          <span className="metric-value">{loading ? '…' : money(revenue?.totalRevenue ?? 0)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Số đơn hàng</span>
          <span className="metric-value">{loading ? '…' : revenue?.totalOrders ?? 0}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Sản phẩm</span>
          <span className="metric-value">{loading ? '…' : stats.products}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Khách hàng</span>
          <span className="metric-value">{loading ? '…' : stats.users}</span>
        </div>
      </div>

      {/* ── Low stock + Orders by status ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div className="admin-card" id="low-stock-card">
          <h2 className="admin-page-title-small" style={{ marginBottom: '16px' }}>Hàng sắp hết</h2>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: stats.lowStock > 0 ? 'var(--admin-danger-text, #B85042)' : 'var(--admin-black)' }}>
              {loading ? '…' : stats.lowStock}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--admin-muted)' }}>
              sản phẩm có tồn kho ≤ {LOW_STOCK_THRESHOLD}
            </span>
          </div>
        </div>

        <div className="admin-card" id="orders-by-status-card">
          <h2 className="admin-page-title-small" style={{ marginBottom: '16px' }}>Đơn theo trạng thái</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {STATUS_DISPLAY.map((s) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="admin-badge" style={{ borderColor: s.color, color: s.color }}>
                  {statusCounts[s.key] || 0}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--admin-muted)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="admin-card" style={{ padding: 0 }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between' }}>
            <h2 className="admin-page-title-small">Đơn hàng gần đây</h2>
            <button className="admin-btn admin-btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>Xem tất cả</button>
          </div>
          <div className="admin-table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>Trạng thái</th>
                  <th>Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => {
                  const id = orderDisplayId(order);
                  const status = orderStatus(order);
                  const total = orderTotal(order);

                  return (
                    <tr key={id}>
                      <td style={{ fontWeight: 500 }}>{id}</td>
                      <td>{orderCustomerName(order)}</td>
                      <td>{orderDateLabel(order)}</td>
                      <td>
                        <span className={`admin-badge ${status.toLowerCase()}`}>
                          {translateStatus(status)}
                        </span>
                      </td>
                      <td>{money(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {recentOrders.length === 0 && !loading && (
              <div className="admin-empty" style={{ padding: '32px' }}>
                <p style={{ color: 'var(--admin-muted)', margin: 0 }}>Không có đơn hàng gần đây.</p>
              </div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <h2 className="admin-page-title-small" style={{ marginBottom: '24px' }}>Thông báo hệ thống</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notifications.slice(0, 5).map((n, idx) => (
              <div key={n.id || idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--admin-mint)', marginTop: '6px' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--admin-black)' }}>{n.message}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-muted)', marginTop: '4px' }}>
                    {translateStatus(n.category || 'SYSTEM')} · {translateStatus(n.status || 'PROCESSED')}
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="admin-empty">
                <p>Không có thông báo mới.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
