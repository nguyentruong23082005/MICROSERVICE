import { useEffect, useState } from 'react';
import {
  adminCreateUser,
  adminGetUsers,
  adminUpdateUserStatus,
  adminUpdateUserRole,
} from '../services/adminService.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { initials } from '../../../utils/formatters.js';
import Pagination from '../components/Pagination.jsx';
import { ADMIN_PAGE_SIZE } from '../../../utils/constants.js';
import { MagnifierIcon } from '../../../components/icons/index.js';

const EMPTY_FORM = {
  userName: '',
  userPassword: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
};

function getUserDetails(user = {}) {
  return user.userDetails || {};
}

function getUserEmail(user = {}) {
  return user.email || getUserDetails(user).email || '';
}

function getUserPhone(user = {}) {
  return user.phone || user.phoneNumber || getUserDetails(user).phoneNumber || '';
}

function getRoleName(user = {}) {
  return user.role?.roleName || user.role || 'ROLE_USER';
}

function isActiveUser(user = {}) {
  if (typeof user.active === 'boolean') return user.active;
  return Number(user.active ?? 1) !== 0;
}

function getDisplayName(user = {}) {
  const details = getUserDetails(user);
  const fullName = [details.firstName, details.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.userName || `User #${user.id}`;
}

function toUserPayload(form) {
  return {
    userName: form.userName.trim(),
    userPassword: form.userPassword,
    userDetails: {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim() || null,
    },
  };
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [detailId, setDetailId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [activeCount, setActiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (currentPage !== 1) {
      Promise.resolve().then(() => {
        setCurrentPage(1);
      });
    }
  }, [debouncedSearch, currentPage]);

  const loadCounts = () => {
    adminGetUsers()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setTotalCount(list.length);
        const active = list.filter(isActiveUser).length;
        setActiveCount(active);
        setBlockedCount(list.length - active);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const load = (page, searchVal) => {
    setLoading(true);
    setError(null);
    adminGetUsers(page - 1, ADMIN_PAGE_SIZE, searchVal)
      .then((data) => {
        if (data && data.content) {
          setUsers(data.content);
          setTotalPages(data.totalPages || 0);
        } else {
          setUsers(Array.isArray(data) ? data : []);
          setTotalPages(0);
        }
      })
      .catch((err) => setError(err.message || 'Không thể tải danh sách tài khoản.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    if (active) {
      Promise.resolve().then(() => {
        if (active) {
          load(currentPage, debouncedSearch);
        }
      });
    }
    return () => { active = false; };
  }, [currentPage, debouncedSearch]);

  const filtered = users;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const created = await adminCreateUser(toUserPayload(form));
      setMessage({ type: 'success', text: `Đã tạo tài khoản "${created?.userName || form.userName}".` });
      resetForm();
      load(currentPage, debouncedSearch);
      loadCounts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể tạo tài khoản.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (userItem) => {
    const nextActive = !isActiveUser(userItem);
    const actionLabel = nextActive ? 'mở khóa' : 'khóa';
    if (!window.confirm(`Bạn có chắc muốn ${actionLabel} tài khoản "${userItem.userName}"?`)) return;

    setUpdatingId(userItem.id);
    setMessage(null);
    try {
      const updated = await adminUpdateUserStatus(userItem.id, nextActive);
      setUsers((current) => current.map((item) => (item.id === userItem.id ? updated : item)));
      setMessage({ type: 'success', text: `Đã ${actionLabel} tài khoản "${userItem.userName}".` });
      loadCounts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || `Không thể ${actionLabel} tài khoản.` });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setMessage(null);
    try {
      const updated = await adminUpdateUserRole(userId, newRole);
      setUsers((current) => current.map((item) => (item.id === userId ? updated : item)));
      setMessage({ type: 'success', text: `Đã cập nhật vai trò thành công.` });
      loadCounts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể cập nhật vai trò.' });
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Khách hàng</h1>
          <p className="admin-subtitle">Quản lý tài khoản, thông tin liên hệ và trạng thái truy cập.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowForm((current) => !current)}>
          {showForm ? 'Đóng' : 'Tạo tài khoản'}
        </button>
      </div>

      {message && (
        <div className={`admin-notice ${message.type === 'error' ? 'admin-notice-error' : 'admin-notice-success'}`}>
          {message.text}
        </div>
      )}
      {error && <div className="admin-notice admin-notice-error">{error}</div>}

      <div className="admin-stats">
        <div className="metric-card highlight">
          <span className="metric-label">Đang hoạt động</span>
          <span className="metric-value">{loading ? '...' : activeCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Tổng khách hàng</span>
          <span className="metric-value">{loading ? '...' : totalCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Đã khóa</span>
          <span className="metric-value">{loading ? '...' : blockedCount}</span>
        </div>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <h2 className="admin-page-title-small" style={{ marginBottom: '20px' }}>Tài khoản mới</h2>
          <form onSubmit={handleCreate} className="admin-form-grid">
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="user-name">Tên đăng nhập</label>
              <input id="user-name" className="admin-input" name="userName" value={form.userName} onChange={handleChange} required autoComplete="username" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="user-password">Mật khẩu</label>
              <input id="user-password" className="admin-input" type="password" name="userPassword" value={form.userPassword} onChange={handleChange} required minLength={6} autoComplete="new-password" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="user-first-name">Tên</label>
              <input id="user-first-name" className="admin-input" name="firstName" value={form.firstName} onChange={handleChange} required />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="user-last-name">Họ</label>
              <input id="user-last-name" className="admin-input" name="lastName" value={form.lastName} onChange={handleChange} required />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="user-email">Email</label>
              <input id="user-email" className="admin-input" type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="user-phone">Số điện thoại</label>
              <input id="user-phone" className="admin-input" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} autoComplete="tel" />
            </div>
            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-outline" onClick={resetForm}>Hủy</button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <MagnifierIcon className="admin-search-icon" size={16} strokeWidth={2} />
          <input type="text" className="admin-search-input" placeholder="Tìm khách hàng..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Liên hệ</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(userItem => {
              const role = getRoleName(userItem);
              const active = isActiveUser(userItem);
              const isExpanded = detailId === userItem.id;
              const isCurrentUser = String(currentUser?.userId) === String(userItem.id);

              return (
                <tr key={userItem.id} style={isExpanded ? { background: 'var(--admin-bg, #fafafa)' } : undefined}>
                  <td>
                    <div className="admin-product-cell">
                      <div className="admin-avatar" style={{ width: 40, height: 40, borderRadius: '50%' }}>
                        {initials(getDisplayName(userItem))}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--admin-black)' }}>{getDisplayName(userItem)}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--admin-muted)' }}>@{userItem.userName} · ID #{userItem.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--admin-black)' }}>{getUserEmail(userItem) || '-'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-muted)' }}>{getUserPhone(userItem) || '-'}</div>
                  </td>
                  <td>
                    <span className="admin-badge" style={role === 'ROLE_ADMIN' ? { background: 'var(--admin-black)', color: 'white', borderColor: 'var(--admin-black)' } : undefined}>
                      {role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${active ? 'active' : 'blocked'}`}>
                      {active ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        className="admin-btn admin-btn-outline"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setDetailId(isExpanded ? null : userItem.id)}
                      >
                        {isExpanded ? 'Đóng' : 'Chi tiết'}
                      </button>
                      <button
                        className="admin-btn admin-btn-outline"
                        style={{ padding: '6px 12px', fontSize: '12px', borderColor: active ? 'var(--admin-danger)' : 'var(--admin-border)', color: active ? 'var(--admin-danger-text)' : 'var(--admin-black)' }}
                        onClick={() => handleToggleStatus(userItem)}
                        disabled={updatingId === userItem.id || isCurrentUser}
                        title={isCurrentUser ? 'Không thể khóa tài khoản đang đăng nhập' : undefined}
                      >
                        {updatingId === userItem.id ? 'Đang lưu...' : active ? 'Khóa' : 'Mở khóa'}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="admin-inline-detail" style={{ textAlign: 'left', marginTop: '12px', padding: '12px', background: '#fafafa', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                        <div><strong>ID:</strong> #{userItem.id}</div>
                        <div><strong>Tên đăng nhập:</strong> {userItem.userName}</div>
                        <div><strong>Họ tên:</strong> {getDisplayName(userItem)}</div>
                        <div><strong>Email:</strong> {getUserEmail(userItem) || '-'}</div>
                        <div><strong>Điện thoại:</strong> {getUserPhone(userItem) || '-'}</div>
                        <div><strong>Vai trò:</strong> {role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</div>
                        <div><strong>Trạng thái:</strong> {active ? 'Hoạt động' : 'Đã khóa'}</div>
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.85rem' }}>Thay đổi vai trò:</strong>
                          <select
                            value={role}
                            onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                            className="admin-filter-select"
                            style={{ padding: '4px 8px', fontSize: '11px', height: '28px', width: 'auto', margin: 0 }}
                            disabled={isCurrentUser}
                            aria-label="Thay đổi vai trò"
                          >
                            <option value="ROLE_USER">Khách hàng</option>
                            <option value="ROLE_ADMIN">Quản trị viên</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        {filtered.length === 0 && loading === false && (
          <div className="admin-empty" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <h3>Không có tài khoản phù hợp</h3>
            <p>Tài khoản khách hàng và quản trị viên sẽ hiển thị tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
