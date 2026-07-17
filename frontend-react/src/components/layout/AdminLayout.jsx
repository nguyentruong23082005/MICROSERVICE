import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../../features/admin/components/AdminHeader.jsx';
import AdminSidebar from '../../features/admin/components/AdminSidebar.jsx';
import '../../assets/styles/admin.css';

const AdminLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="admin-layout">
      <AdminHeader menuOpen={menuOpen} onMenuToggle={() => setMenuOpen((open) => !open)} />
      <div className="admin-container">
        <AdminSidebar open={menuOpen} onNavigate={closeMenu} />
        {menuOpen && (
          <button
            type="button"
            className="admin-sidebar-backdrop"
            aria-label="Đóng menu quản trị"
            onClick={closeMenu}
          />
        )}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
