import { useState, useEffect } from 'react';
import { adminGetUsers } from '../../services/adminService.js';
import { initials } from '../../utils/formatters.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminGetUsers()
      .then(d => setUsers(Array.isArray(d) ? d : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel">
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="eyebrow">Quản lý</p>
          <h2>Người dùng ({users.length})</h2>
        </div>
      </div>

      {loading && <div className="loading-spinner" />}
      {error && <p className="muted" style={{ color: 'var(--accent)' }}>{error}</p>}

      <div className="admin-list">
        {users.map(u => (
          <div key={u.id} className="admin-row">
            {/* Avatar */}
            <div style={{
              width: 80, height: 60, background: 'var(--primary)',
              display: 'grid', placeItems: 'center',
              color: '#fff', fontWeight: 900, fontSize: '1.1rem',
              border: '1px solid var(--line)',
            }}>
              {initials(u.userName)}
            </div>
            <div>
              <strong style={{ display: 'block' }}>{u.userName}</strong>
              <span className="muted" style={{ fontSize: '.82rem' }}>
                ID #{u.id} · {u.role?.roleName || 'ROLE_USER'} · Active: {u.active}
              </span>
            </div>
            <span style={{
              padding: '4px 10px',
              background: u.role?.roleName === 'ROLE_ADMIN' ? 'var(--primary)' : 'var(--surface-soft)',
              color: u.role?.roleName === 'ROLE_ADMIN' ? '#fff' : 'var(--text-ink)',
              fontWeight: 700,
              fontSize: '.75rem',
              border: '1px solid var(--line)',
              textTransform: 'uppercase',
            }}>
              {u.role?.roleName === 'ROLE_ADMIN' ? 'Admin' : 'User'}
            </span>
          </div>
        ))}
        {!loading && users.length === 0 && (
          <p className="muted">Không có dữ liệu người dùng.</p>
        )}
      </div>
    </div>
  );
}
