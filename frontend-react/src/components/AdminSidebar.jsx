import React from 'react';
import { NavLink } from 'react-router-dom';

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <nav className="admin-sidebar-nav" aria-label="Admin Navigation">
        <NavLink 
          to="/admin/products" 
          className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
        >
          🍵 Thực đơn
        </NavLink>
        
        <NavLink 
          to="/admin/users" 
          className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
        >
          👤 Người dùng
        </NavLink>
        
        <NavLink 
          to="/admin/orders" 
          className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}
        >
          📦 Đơn hàng
        </NavLink>
      </nav>
      
      <div className="muted text-center" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
        PL v1.10.0 · © 2026
      </div>
    </aside>
  );
}
