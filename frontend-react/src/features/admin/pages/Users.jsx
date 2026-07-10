import { useState, useEffect } from 'react';
import { adminGetUsers } from '../services/adminService.js';
import { initials, money } from '../../../utils/formatters.js';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    adminGetUsers()
      .then(d => setUsers(Array.isArray(d) ? d : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !search ||
    u.userName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );


  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Khách hàng</h1>
          <p className="admin-subtitle">Xem và quản lý thông tin tài khoản khách hàng.</p>
        </div>
      </div>

      {error && <div className="admin-notice admin-notice-error">{error}</div>}

      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" className="admin-search-input" placeholder="Tìm khách hàng..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Liên hệ</th>
              <th>Đơn hàng</th>
              <th>Tổng chi tiêu</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const isAdmin = u.role?.roleName === 'ROLE_ADMIN';
              const isActive = u.active !== false;
              const isExpanded = detailId === u.id;

              return (
                <tr key={u.id} style={isExpanded ? { background: 'var(--admin-bg, #fafafa)' } : undefined}>
                  <td>
                    <div className="admin-product-cell">
                      <div className="admin-avatar" style={{ width: 40, height: 40, borderRadius: '50%' }}>
                        {initials(u.userName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--admin-black)' }}>{u.userName}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--admin-muted)' }}>ID: #{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--admin-black)' }}>{u.email || '—'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-muted)' }}>{u.phone || '—'}</div>
                  </td>
                  <td>{u.orders ?? 0} đơn</td>
                  <td>{money(u.spent ?? 0)}</td>
                  <td>
                    <span className={`admin-badge ${isActive ? 'active' : 'blocked'}`}>
                      {isActive ? 'Đang hoạt động' : 'Đã khoá'}
                    </span>
                    {isAdmin && (
                      <span className="admin-badge" style={{ marginLeft: 8, background: 'var(--admin-black)', color: 'white', borderColor: 'var(--admin-black)' }}>Quản trị viên</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="admin-btn admin-btn-outline"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setDetailId(isExpanded ? null : u.id)}
                    >
                      {isExpanded ? 'Đóng' : 'Xem chi tiết'}
                    </button>
                    {isExpanded && (
                      <div style={{ textAlign: 'left', marginTop: '12px', padding: '12px', background: 'var(--admin-white, white)', borderRadius: '8px', border: '1px solid var(--admin-border)', fontSize: '0.88rem', lineHeight: 1.8 }}>
                        <div><strong>ID:</strong> #{u.id}</div>
                        <div><strong>Tên:</strong> {u.userName}</div>
                        <div><strong>Email:</strong> {u.email || '—'}</div>
                        <div><strong>Điện thoại:</strong> {u.phone || '—'}</div>
                        <div><strong>Vai trò:</strong> {u.role?.roleName || 'ROLE_USER'}</div>
                        <div><strong>Trạng thái:</strong> {isActive ? 'Hoạt động' : 'Đã khoá'}</div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && loading === false && (
          <div className="admin-empty" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <h3>Không tìm thấy khách hàng nào</h3>
          </div>
        )}
      </div>
    </div>
  );
}
