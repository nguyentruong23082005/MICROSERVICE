import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="admin-header-bar">
      <div className="admin-header-brand">
        <span className="admin-header-logo">PL</span>
        <span>Admin Panel</span>
      </div>
      
      <div className="admin-header-actions">
        {user && (
          <span style={{ fontSize: '13px', fontWeight: 700, opacity: 0.9 }}>
            Quản trị viên: {user.userName}
          </span>
        )}
        <button 
          className="btn btn-secondary-on-dark btn-sm" 
          onClick={() => navigate('/')}
        >
          ← Storefront
        </button>
        <button 
          className="btn btn-secondary-on-dark btn-sm" 
          onClick={handleLogout}
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
