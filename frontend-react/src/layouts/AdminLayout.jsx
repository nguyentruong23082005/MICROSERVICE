import React from 'react';
import AdminHeader from '../components/AdminHeader.jsx';
import AdminSidebar from '../components/AdminSidebar.jsx';
import '../styles/admin.css'; // style riêng cho admin layout

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <AdminHeader />
      <div className="admin-container">
        <AdminSidebar />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
