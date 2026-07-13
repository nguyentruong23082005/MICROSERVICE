import { useEffect, useState } from 'react';
import {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from '../services/adminService.js';

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  displayOrder: 0,
  active: true,
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    adminGetCategories()
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err.message || 'Không thể tải danh sách danh mục.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) load();
    });
    return () => { active = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      displayOrder: category.displayOrder ?? 0,
      active: category.active !== false,
    });
    setShowAdd(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowAdd(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...form,
        displayOrder: Number(form.displayOrder || 0),
      };

      if (editingId) {
        await adminUpdateCategory(editingId, payload);
        setMessage({ type: 'success', text: `Đã cập nhật danh mục "${form.name}" thành công.` });
      } else {
        await adminCreateCategory(payload);
        setMessage({ type: 'success', text: `Đã tạo danh mục "${form.name}" thành công.` });
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowAdd(false);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể lưu danh mục.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá danh mục "${category.name}"?`)) return;

    try {
      await adminDeleteCategory(category.id);
      setMessage({ type: 'success', text: `Đã xoá danh mục "${category.name}".` });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể xoá danh mục.' });
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Danh mục</h1>
          <p className="admin-subtitle">Quản lý các danh mục sản phẩm của cửa hàng.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Đóng' : 'Thêm danh mục'}
        </button>
      </div>

      {message && (
        <div className={`admin-notice ${message.type === 'error' ? 'admin-notice-error' : 'admin-notice-success'}`}>
          {message.text}
        </div>
      )}

      {error && <div className="admin-notice admin-notice-error">{error}</div>}

      {showAdd && (
        <div className="admin-card" style={{ marginBottom: '32px' }}>
          <h2 className="admin-page-title-small" style={{ marginBottom: '24px' }}>
            {editingId ? 'Sửa danh mục' : 'Danh mục mới'}
          </h2>
          <form onSubmit={handleSubmit} className="admin-form-grid">
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="cat-name">Tên danh mục</label>
              <input id="cat-name" className="admin-input" name="name" value={form.name} onChange={handleChange} placeholder="Nhập tên danh mục" required />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="cat-slug">Slug (Đường dẫn tĩnh)</label>
              <input id="cat-slug" className="admin-input" name="slug" value={form.slug} onChange={handleChange} placeholder="vi-du-danh-muc" required />
            </div>
            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-label" htmlFor="cat-desc">Mô tả</label>
              <input id="cat-desc" className="admin-input" name="description" value={form.description} onChange={handleChange} placeholder="Nhập mô tả ngắn" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="cat-img">Đường dẫn ảnh (URL)</label>
              <input id="cat-img" className="admin-input" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="cat-order">Thứ tự hiển thị</label>
              <input id="cat-order" className="admin-input" type="number" name="displayOrder" value={form.displayOrder} onChange={handleChange} min="0" />
            </div>
            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-black)', fontWeight: 500 }}>
                <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
                Hiển thị danh mục này trên cửa hàng
              </label>
            </div>

            <div className="admin-form-actions">
              <button type="button" className="admin-btn admin-btn-outline" onClick={handleCancel}>Huỷ</button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu danh mục'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tên danh mục</th>
              <th>Đường dẫn tĩnh (Slug)</th>
              <th>Thứ tự hiển thị</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td style={{ fontWeight: 500 }}>{category.id}</td>
                <td>
                  {category.imageUrl ? (
                    <img src={category.imageUrl} alt={category.name} className="admin-thumb" style={{ width: '40px', height: '40px' }} />
                  ) : (
                    <div className="admin-thumb" style={{ width: '40px', height: '40px' }}></div>
                  )}
                </td>
                <td style={{ fontWeight: 500, color: 'var(--admin-black)' }}>{category.name}</td>
                <td>{category.slug}</td>
                <td>{category.displayOrder ?? 0}</td>
                <td>
                  <span className={`admin-badge ${category.active !== false ? 'active' : 'blocked'}`}>
                    {category.active !== false ? 'Đang hiển thị' : 'Đang ẩn'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="admin-btn admin-btn-outline" style={{ padding: '6px 12px', fontSize: '12px', marginRight: '8px' }} onClick={() => handleEdit(category)}>Sửa</button>
                  <button className="admin-btn admin-btn-outline" style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--admin-danger)', color: 'var(--admin-danger-text)' }} onClick={() => handleDelete(category)}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && !loading && (
          <div className="admin-empty" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <h3>Chưa có danh mục nào</h3>
            <p>Bắt đầu xây dựng bằng cách thêm danh mục sản phẩm mới.</p>
            <button className="admin-btn admin-btn-primary" onClick={() => setShowAdd(true)}>Thêm danh mục</button>
          </div>
        )}
      </div>
    </div>
  );
}
