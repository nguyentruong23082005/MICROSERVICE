import { useEffect, useMemo, useState } from 'react';
import {
  adminCreateContentPage,
  adminDeleteContentPage,
  adminGetContentPages,
  adminUpdateContentPage,
} from '../services/adminService.js';
import Pagination from '../components/Pagination.jsx';
import AdminModal from '../components/AdminModal.jsx';
import { paginateItems } from '../utils/paginateItems.js';
import { ADMIN_PAGE_SIZE } from '../../../utils/constants.js';

const EMPTY_FORM = {
  slug: '',
  title: '',
  pageType: 'PAGE',
  summary: '',
  body: '',
  displayOrder: 0,
  published: true,
};

function toForm(page) {
  return {
    slug: page.slug || '',
    title: page.title || '',
    pageType: page.pageType || 'PAGE',
    summary: page.summary || '',
    body: page.body || '',
    displayOrder: page.displayOrder || 0,
    published: page.published !== false,
  };
}

function toPayload(form) {
  return {
    slug: form.slug.trim(),
    title: form.title.trim(),
    pageType: form.pageType.trim() || 'PAGE',
    summary: form.summary.trim(),
    body: form.body.trim(),
    displayOrder: Number(form.displayOrder || 0),
    published: form.published,
  };
}

export default function ContentPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);


  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pages;
    return pages.filter((page) => (
      page.title?.toLowerCase().includes(term) ||
      page.slug?.toLowerCase().includes(term) ||
      page.pageType?.toLowerCase().includes(term)
    ));
  }, [pages, search]);

  const load = () => {
    setLoading(true);
    setError(null);
    adminGetContentPages()
      .then((data) => setPages(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) load();
    });
    return () => { active = false; };
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMessage(null);
    setShowForm(true);
  };

  const handleEdit = (page) => {
    setEditingId(page.id);
    setForm(toForm(page));
    setMessage(null);
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = toPayload(form);
      if (editingId) {
        await adminUpdateContentPage(editingId, payload);
        setMessage({ type: 'success', text: 'Đã cập nhật trang nội dung.' });
      } else {
        await adminCreateContentPage(payload);
        setMessage({ type: 'success', text: 'Đã tạo trang nội dung mới.' });
      }
      resetForm();
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể lưu nội dung.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (page) => {
    if (!window.confirm(`Xóa trang ${page.slug}?`)) return;
    setMessage(null);
    try {
      await adminDeleteContentPage(page.id);
      setMessage({ type: 'success', text: 'Đã xóa trang nội dung.' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể xóa trang nội dung.' });
    }
  };

  const publishedCount = pages.filter((page) => page.published !== false).length;
  const draftCount = pages.length - publishedCount;

  return (
    <div className="admin-page-shell">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Nội dung</h1>
          <p className="admin-subtitle">Quản lý các trang giới thiệu, showroom, liên hệ và chính sách.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleCreate}>
          Thêm trang nội dung
        </button>
      </div>

      {message && (
        <div className={`admin-notice ${message.type === 'success' ? 'admin-notice-success' : 'admin-notice-error'}`}>
          {message.text}
        </div>
      )}
      {error && <div className="admin-notice admin-notice-error">{error}</div>}

      <div className="admin-stats">
        <div className="metric-card highlight">
          <span className="metric-label">Đã xuất bản</span>
          <span className="metric-value">{loading ? '...' : publishedCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Bản nháp</span>
          <span className="metric-value">{loading ? '...' : draftCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Tổng trang</span>
          <span className="metric-value">{loading ? '...' : pages.length}</span>
        </div>
      </div>

      <AdminModal
        isOpen={showForm}
        title={editingId ? 'Sửa trang nội dung' : 'Trang nội dung mới'}
        subtitle="Soạn nội dung tĩnh cho trang giới thiệu, showroom, liên hệ, chính sách và landing page."
        size="lg"
        onClose={resetForm}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn-outline" onClick={resetForm}>Hủy</button>
            <button type="submit" form="admin-content-form" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu trang'}
            </button>
          </>
        )}
      >
        <form id="admin-content-form" onSubmit={handleSubmit} className="admin-form-grid">
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="content-title">Tiêu đề</label>
            <input id="content-title" name="title" className="admin-input" value={form.title} onChange={handleChange} required />
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="content-slug">Slug</label>
            <input id="content-slug" name="slug" className="admin-input" value={form.slug} onChange={handleChange} placeholder="Nhập slug trang" required />
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="content-type">Loại trang</label>
            <select id="content-type" name="pageType" className="admin-input" value={form.pageType} onChange={handleChange}>
              <option value="PAGE">Trang thường</option>
              <option value="COLLECTION">Bộ sưu tập</option>
              <option value="ABOUT">Giới thiệu</option>
              <option value="SHOWROOM">Showroom</option>
              <option value="CONTACT">Liên hệ</option>
              <option value="POLICY">Chính sách</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="content-order">Thứ tự hiển thị</label>
            <input id="content-order" type="number" name="displayOrder" className="admin-input" value={form.displayOrder} onChange={handleChange} />
          </div>
          <div className="admin-form-group admin-form-span-2">
            <label className="admin-label" htmlFor="content-summary">Tóm tắt</label>
            <input id="content-summary" name="summary" className="admin-input" value={form.summary} onChange={handleChange} />
          </div>
          <div className="admin-form-group admin-form-span-2">
            <label className="admin-label" htmlFor="content-body">Nội dung</label>
            <textarea id="content-body" name="body" className="admin-input" value={form.body} onChange={handleChange} rows="6" />
          </div>
          <label className="admin-check-row">
            <input type="checkbox" name="published" checked={form.published} onChange={handleChange} />
            Xuất bản
          </label>
        </form>
      </AdminModal>

      <AdminModal
        isOpen={Boolean(selectedPage)}
        title={selectedPage?.title || 'Chi tiết trang'}
        subtitle="Xem nhanh cấu hình xuất bản và nội dung chính của trang."
        size="lg"
        onClose={() => setSelectedPage(null)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn-outline" onClick={() => setSelectedPage(null)}>Đóng</button>
            {selectedPage && (
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => { handleEdit(selectedPage); setSelectedPage(null); }}>
                Sửa trang
              </button>
            )}
          </>
        )}
      >
        {selectedPage && (
          <div className="admin-detail-grid">
            <div className="admin-detail-item">
              <span className="admin-detail-label">Slug</span>
              <p className="admin-detail-value">{selectedPage.slug}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Loại trang</span>
              <p className="admin-detail-value">{selectedPage.pageType || 'PAGE'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Thứ tự</span>
              <p className="admin-detail-value">{selectedPage.displayOrder || 0}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Trạng thái</span>
              <p className="admin-detail-value">{selectedPage.published !== false ? 'Đã xuất bản' : 'Bản nháp'}</p>
            </div>
            <div className="admin-detail-item admin-form-span-2">
              <span className="admin-detail-label">Tóm tắt</span>
              <p className="admin-detail-value">{selectedPage.summary || 'Chưa có tóm tắt.'}</p>
            </div>
            <div className="admin-detail-item admin-form-span-2">
              <span className="admin-detail-label">Nội dung</span>
              <p className="admin-detail-value">{selectedPage.body || 'Chưa có nội dung.'}</p>
            </div>
          </div>
        )}
      </AdminModal>

      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <input className="admin-search-input" value={search} onChange={(event) => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }} placeholder="Tìm trang nội dung..." />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Slug</th>
              <th>Loại</th>
              <th>Thứ tự</th>
              <th>Trạng thái</th>
              <th className="admin-table-actions-head">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginateItems(filtered, currentPage, ADMIN_PAGE_SIZE).items.map((page) => (
              <tr key={page.id}>
                <td>
                  <div className="admin-table-primary">{page.title}</div>
                  <div className="admin-table-secondary admin-table-secondary--truncate">
                    {page.summary || '-'}
                  </div>
                </td>
                <td>{page.slug}</td>
                <td>{page.pageType || 'PAGE'}</td>
                <td>{page.displayOrder || 0}</td>
                <td>
                  <span className={`admin-badge ${page.published !== false ? 'active' : 'blocked'}`}>
                    {page.published !== false ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                </td>
                <td className="admin-table-actions-cell">
                  <div className="admin-action-group">
                    <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => setSelectedPage(page)}>Chi tiết</button>
                    <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => handleEdit(page)}>Sửa</button>
                    <button className="admin-btn admin-btn-danger admin-btn--small" onClick={() => handleDelete(page)}>Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={paginateItems(filtered, currentPage, ADMIN_PAGE_SIZE).totalPages}
          onPageChange={setCurrentPage}
        />
        {filtered.length === 0 && !loading && (
          <div className="admin-empty">
            <h3>Chưa có trang nội dung</h3>
            <p>Trang tạo tại đây có thể đọc ở /pages/:slug khi được xuất bản.</p>
          </div>
        )}
      </div>
    </div>
  );
}
