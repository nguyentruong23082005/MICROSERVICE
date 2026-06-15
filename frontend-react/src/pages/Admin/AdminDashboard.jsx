import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { adminGetProducts, adminGetUsers } from '../../services/adminService.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: '…', users: '…' });

  useEffect(() => {
    Promise.allSettled([adminGetProducts(), adminGetUsers()]).then(([p, u]) => {
      setStats({
        products: p.status === 'fulfilled' ? p.value?.length ?? 0 : 'Err',
        users: u.status === 'fulfilled' ? u.value?.length ?? 0 : 'Err',
      });
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>Thống kê</p>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700 }}>Tổng quan hệ thống</h1>
      </div>

      {/* Metric cards */}
      <div className="admin-stats">
        <div className="metric-card">
          <span className="metric-label">Món nước</span>
          <strong className="metric-value">{stats.products}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Người dùng</span>
          <strong className="metric-value">{stats.users}</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Services</span>
          <strong className="metric-value">3</strong>
        </div>
        <div className="metric-card">
          <span className="metric-label">Kafka</span>
          <strong className="metric-value">ON</strong>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <Outlet />
      </div>
    </div>
  );
}
