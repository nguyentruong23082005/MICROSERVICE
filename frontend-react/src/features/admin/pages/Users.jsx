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
import AdminModal from '../components/AdminModal.jsx';
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
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
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
      setSelectedUser((current) => (current?.id === userItem.id ? updated : current));
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
      setSelectedUser((current) => (current?.id === userId ? updated : current));
      setMessage({ type: 'success', text: `Đã cập nhật vai trò thành công.` });
      loadCounts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể cập nhật vai trò.' });
    }
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Người dùng</h1>
          <p className="admin-subtitle">Quản lý tài khoản, thông tin liên hệ và trạng thái truy cập.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowForm(true)}>
          Tạo tài khoản
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
          <span className="metric-label">Tổng người dùng</span>
          <span className="metric-value">{loading ? '...' : totalCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Đã khóa</span>
          <span className="metric-value">{loading ? '...' : blockedCount}</span>
        </div>
      </div>

      <AdminModal
        isOpen={showForm}
        title="Tài khoản mới"
        subtitle="Tạo tài khoản khách hàng hoặc quản trị viên cơ bản, sau đó có thể đổi vai trò ở trang chi tiết."
        size="md"
        onClose={resetForm}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn-outline" onClick={resetForm}>Hủy</button>
            <button type="submit" form="admin-user-form" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </>
        )}
      >
        <form id="admin-user-form" onSubmit={handleCreate} className="admin-form-grid">
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
        </form>
      </AdminModal>

      <AdminModal
        isOpen={Boolean(selectedUser)}
        title={selectedUser ? getDisplayName(selectedUser) : 'Chi tiết người dùng'}
        subtitle="Xem thông tin liên hệ, trạng thái truy cập và cập nhật vai trò tài khoản."
        size="md"
        onClose={() => setSelectedUser(null)}
        footer={<button type="button" className="admin-btn admin-btn-outline" onClick={() => setSelectedUser(null)}>Đóng</button>}
      >
        {selectedUser && (() => {
          const role = getRoleName(selectedUser);
          const active = isActiveUser(selectedUser);
          const isCurrentUser = String(currentUser?.userId) === String(selectedUser.id);

          return (
            <div className="admin-detail-grid">
              <div className="admin-detail-item">
                <span className="admin-detail-label">ID</span>
                <p className="admin-detail-value">#{selectedUser.id}</p>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Tên đăng nhập</span>
                <p className="admin-detail-value">@{selectedUser.userName}</p>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Email</span>
                <p className="admin-detail-value">{getUserEmail(selectedUser) || '-'}</p>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Điện thoại</span>
                <p className="admin-detail-value">{getUserPhone(selectedUser) || '-'}</p>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Trạng thái</span>
                <p className="admin-detail-value">{active ? 'Hoạt động' : 'Đã khóa'}</p>
              </div>
              <div className="admin-detail-item">
                <span className="admin-detail-label">Vai trò hiện tại</span>
                <p className="admin-detail-value">{role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Người dùng'}</p>
              </div>
              <div className="admin-detail-item admin-form-span-2">
                <label className="admin-detail-label" htmlFor="selected-user-role">Thay đổi vai trò</label>
                <select
                  id="selected-user-role"
                  value={role}
                  onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                  className="admin-filter-select admin-compact-select"
                  disabled={isCurrentUser}
                  aria-label="Thay đổi vai trò"
                >
                  <option value="ROLE_USER">Người dùng</option>
                  <option value="ROLE_ADMIN">Quản trị viên</option>
                </select>
                {isCurrentUser && <p className="admin-detail-value">Không thể đổi vai trò tài khoản đang đăng nhập.</p>}
              </div>
            </div>
          );
        })()}
      </AdminModal>

      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <MagnifierIcon className="admin-search-icon" size={16} strokeWidth={2} />
          <input type="text" className="admin-search-input" placeholder="Tìm người dùng..." value={search} onChange={e => setSearch(e.target.value)} />
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
              <th className="admin-table-actions-head">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(userItem => {
              const role = getRoleName(userItem);
              const active = isActiveUser(userItem);
              const isCurrentUser = String(currentUser?.userId) === String(userItem.id);

              return (
                <tr key={userItem.id}>
                  <td>
                    <div className="admin-product-cell">
                      <div className="admin-avatar admin-avatar--table">
                        {initials(getDisplayName(userItem))}
                      </div>
                      <div>
                        <div className="admin-table-primary">{getDisplayName(userItem)}</div>
                        <div className="admin-table-secondary">@{userItem.userName} · ID #{userItem.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-table-primary">{getUserEmail(userItem) || '-'}</div>
                    <div className="admin-table-secondary">{getUserPhone(userItem) || '-'}</div>
                  </td>
                  <td>
                    <span className={`admin-badge ${role === 'ROLE_ADMIN' ? 'admin-role-badge' : ''}`}>
                      {role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${active ? 'active' : 'blocked'}`}>
                      {active ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="admin-table-actions-cell">
                    <div className="admin-action-group">
                      <button
                        className="admin-btn admin-btn-outline admin-btn--small"
                        onClick={() => setSelectedUser(userItem)}
                      >
                        Chi tiết
                      </button>
                      <button
                        className={`admin-btn admin-btn--small ${active ? 'admin-btn-danger' : 'admin-btn-outline'}`}
                        onClick={() => handleToggleStatus(userItem)}
                        disabled={updatingId === userItem.id || isCurrentUser}
                        title={isCurrentUser ? 'Không thể khóa tài khoản đang đăng nhập' : undefined}
                      >
                        {updatingId === userItem.id ? 'Đang lưu...' : active ? 'Khóa' : 'Mở khóa'}
                      </button>
                    </div>
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
          <div className="admin-empty">
            <h3>Không có tài khoản phù hợp</h3>
            <p>Tài khoản người dùng và quản trị viên sẽ hiển thị tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}
