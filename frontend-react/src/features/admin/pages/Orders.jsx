import { useState, useEffect } from 'react';
import { adminGetOrders } from '../services/adminService.js';
import { adminUpdateOrderStatus } from '../../orders/index.js';
import { money } from '../../../utils/formatters.js';
import { translateStatus, translatePayment } from '../../../utils/uiText.js';
import {
  orderCustomerEmail,
  orderCustomerName,
  orderDateLabel,
  orderDisplayId,
  orderItemsCount,
  orderPaymentMethod,
  orderStatus,
  orderTotal,
} from '../../orders/utils/orderViewModel.js';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const counts = orders.reduce(
    (nextCounts, order) => {
      const status = orderStatus(order);
      return {
        ...nextCounts,
        [status]: (nextCounts[status] || 0) + 1,
      };
    },
    {},
  );

  const filtered = orders.filter(o => {
    const status = orderStatus(o);
    const customer = orderCustomerName(o);
    const id = orderDisplayId(o);
    return (
      (!filterStatus || status === filterStatus) &&
      (!search ||
        customer.toLowerCase().includes(search.toLowerCase()) ||
        String(id).includes(search))
    );
  });

  const load = () => {
    setLoading(true);
    adminGetOrders()
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) load();
    });
    return () => { active = false; };
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await adminUpdateOrderStatus(orderId, newStatus);
      load();
    } catch (err) {
      alert("Không thể cập nhật trạng thái đơn hàng: " + err.message);
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Đơn hàng</h1>
          <p className="admin-subtitle">Theo dõi và xử lý đơn đặt hàng của khách hàng.</p>
        </div>
        <button className="admin-btn admin-btn-outline">Xuất dữ liệu</button>
      </div>

      {error && <div className="admin-notice admin-notice-error">{error}</div>}

      <div className="admin-stats">
        <div className="metric-card">
          <span className="metric-label">Đang chờ</span>
          <span className="metric-value">{counts.PAYMENT_EXPECTED || counts.Pending || 0}</span>
        </div>
        <div className="metric-card highlight-alt">
          <span className="metric-label">Đang xử lý</span>
          <span className="metric-value">{counts.PAID || counts.Processing || 0}</span>
        </div>
        <div className="metric-card highlight">
          <span className="metric-label">Đang giao</span>
          <span className="metric-value">{counts.SHIPPING || counts.Shipping || 0}</span>
        </div>
        <div className="metric-card" style={{ background: 'var(--admin-black)', color: 'white', borderColor: 'var(--admin-black)' }}>
          <span className="metric-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Hoàn tất</span>
          <span className="metric-value" style={{ color: 'white' }}>{counts.DELIVERED || counts.Completed || 0}</span>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" className="admin-search-input" placeholder="Tìm đơn hàng hoặc khách hàng..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="admin-filter-select" aria-label="Lọc theo trạng thái" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="PAYMENT_EXPECTED">Đang chờ thanh toán</option>
          <option value="PAID">Đã thanh toán</option>
          <option value="DELIVERED">Đã giao hàng</option>
          <option value="CANCELLED">Đã huỷ</option>
        </select>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Sản phẩm</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
              <th>Tổng tiền</th>
              <th>Ngày đặt</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const id = orderDisplayId(o);
              const status = orderStatus(o);
              const customer = orderCustomerName(o);
              const email = orderCustomerEmail(o);
              const total = orderTotal(o);
              const date = orderDateLabel(o);
              const itemsCount = orderItemsCount(o);
              const payment = orderPaymentMethod(o);

              return (
                <tr key={id}>
                  <td style={{ fontWeight: 500 }}>{id}</td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--admin-black)' }}>{customer}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-muted)' }}>{email}</div>
                  </td>
                  <td>{itemsCount} món</td>
                  <td>{translatePayment(payment)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={`admin-badge ${status.toLowerCase()}`}>
                      {translateStatus(status)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{money(total)}</td>
                  <td style={{ color: 'var(--admin-muted)' }}>{date}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {status.toUpperCase() === 'PAYMENT_EXPECTED' && (
                        <button className="admin-btn admin-btn-outline" style={{ padding: '4px 8px', fontSize: '11px', margin: 0 }} onClick={() => handleUpdateStatus(id, 'PAID')}>Xác nhận TT</button>
                      )}
                      {status.toUpperCase() === 'PAID' && (
                        <button className="admin-btn admin-btn-outline" style={{ padding: '4px 8px', fontSize: '11px', margin: 0 }} onClick={() => handleUpdateStatus(id, 'DELIVERED')}>Giao hàng</button>
                      )}
                      <select
                        value={status}
                        onChange={(e) => handleUpdateStatus(id, e.target.value)}
                        className="admin-filter-select"
                        style={{ padding: '4px 8px', fontSize: '11px', height: '28px', width: 'auto', margin: 0, minWidth: '120px' }}
                        aria-label="Cập nhật trạng thái"
                      >
                        <option value="PAYMENT_EXPECTED">Chờ thanh toán</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="DELIVERED">Đã giao hàng</option>
                        <option value="CANCELLED">Huỷ đơn</option>
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && !loading && (
          <div className="admin-empty" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <h3>Không tìm thấy đơn hàng</h3>
            <p>Đơn hàng đặt từ khách sẽ hiển thị tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
