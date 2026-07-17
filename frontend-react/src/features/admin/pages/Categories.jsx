import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  adminGetCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminUploadImage,
} from '../services/adminService.js';
import { GATEWAY_BASE_URL } from '../../../api/client.js';
import Pagination from '../components/Pagination.jsx';
import AdminModal from '../components/AdminModal.jsx';
import { paginateItems } from '../utils/paginateItems.js';
import { ADMIN_PAGE_SIZE } from '../../../utils/constants.js';


const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  displayOrder: 0,
  active: true,
};

export default function Categories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminGetCategories()
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err.message || t('admin.category_management.load_error'));
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) load();
    });
    return () => { active = false; };
  }, [load]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowAdd(true);
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setMessage({ type: 'success', text: t('admin.category_management.uploading') });
      const res = await adminUploadImage(file);
      if (res && res.url) {
        const fullUrl = res.url.startsWith('/') ? `${GATEWAY_BASE_URL}${res.url}` : res.url;
        setForm((current) => ({
          ...current,
          imageUrl: fullUrl,
        }));
        setMessage({ type: 'success', text: t('admin.category_management.upload_success') });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || t('admin.category_management.upload_error') });
    }
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
        setMessage({ type: 'success', text: t('admin.category_management.update_success', { name: form.name }) });
      } else {
        await adminCreateCategory(payload);
        setMessage({ type: 'success', text: t('admin.category_management.create_success', { name: form.name }) });
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowAdd(false);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || t('admin.category_management.save_error') });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(t('admin.category_management.delete_confirm', { name: category.name }))) return;

    try {
      await adminDeleteCategory(category.id);
      setMessage({ type: 'success', text: t('admin.category_management.delete_success', { name: category.name }) });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || t('admin.category_management.delete_error') });
    }
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">{t('admin.category_management.title')}</h1>
          <p className="admin-subtitle">{t('admin.category_management.description')}</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleCreate}>
          {t('admin.category_management.add_category')}
        </button>
      </div>

      {message && (
        <div className={`admin-notice ${message.type === 'error' ? 'admin-notice-error' : 'admin-notice-success'}`}>
          {message.text}
        </div>
      )}

      {error && <div className="admin-notice admin-notice-error">{error}</div>}

      <AdminModal
        isOpen={showAdd}
        title={editingId ? t('admin.category_management.edit_category') : t('admin.category_management.new_category')}
        subtitle={t('admin.category_management.description')}
        size="md"
        onClose={handleCancel}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn-outline" onClick={handleCancel}>{t('admin.category_management.cancel')}</button>
            <button type="submit" form="admin-category-form" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? t('admin.category_management.saving') : t('admin.category_management.save_category')}
            </button>
          </>
        )}
      >
        <form id="admin-category-form" onSubmit={handleSubmit} className="admin-form-grid">
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="cat-name">{t('admin.category_management.name')}</label>
            <input id="cat-name" className="admin-input" name="name" value={form.name} onChange={handleChange} placeholder={t('admin.category_management.name_placeholder')} required />
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="cat-slug">{t('admin.category_management.slug')}</label>
            <input id="cat-slug" className="admin-input" name="slug" value={form.slug} onChange={handleChange} placeholder="vi-du-danh-muc" required />
          </div>
          <div className="admin-form-group admin-form-span-2">
            <label className="admin-label" htmlFor="cat-desc">{t('admin.category_management.description_label')}</label>
            <input id="cat-desc" className="admin-input" name="description" value={form.description} onChange={handleChange} placeholder={t('admin.category_management.description_placeholder')} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="cat-img">{t('admin.category_management.image_url')}</label>
            <div className="admin-input-row">
              <input id="cat-img" className="admin-input" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://" />
              <label className="admin-btn admin-btn-outline admin-upload-btn">
                {t('admin.category_management.upload_image')}
                <input className="admin-visually-hidden" type="file" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="cat-order">{t('admin.category_management.display_order')}</label>
            <input id="cat-order" className="admin-input" type="number" name="displayOrder" value={form.displayOrder} onChange={handleChange} min="0" />
          </div>
          <div className="admin-form-group admin-form-span-2">
            <label className="admin-check-row">
              <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
              {t('admin.category_management.show_on_store')}
            </label>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        isOpen={Boolean(selectedCategory)}
        title={selectedCategory?.name || 'Chi tiết danh mục'}
        subtitle="Tổng quan trạng thái hiển thị và dữ liệu SEO của danh mục."
        size="md"
        onClose={() => setSelectedCategory(null)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn-outline" onClick={() => setSelectedCategory(null)}>Đóng</button>
            {selectedCategory && (
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => { handleEdit(selectedCategory); setSelectedCategory(null); }}>
                Sửa danh mục
              </button>
            )}
          </>
        )}
      >
        {selectedCategory && (
          <div className="admin-detail-grid">
            <div className="admin-detail-item">
              <span className="admin-detail-label">ID</span>
              <p className="admin-detail-value">#{selectedCategory.id}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Slug</span>
              <p className="admin-detail-value">{selectedCategory.slug || '-'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Thứ tự</span>
              <p className="admin-detail-value">{selectedCategory.displayOrder ?? 0}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Trạng thái</span>
              <p className="admin-detail-value">{selectedCategory.active !== false ? 'Đang hiển thị' : 'Đang ẩn'}</p>
            </div>
            <div className="admin-detail-item admin-form-span-2">
              <span className="admin-detail-label">Mô tả</span>
              <p className="admin-detail-value">{selectedCategory.description || 'Chưa có mô tả.'}</p>
            </div>
            <div className="admin-detail-item admin-form-span-2">
              <span className="admin-detail-label">Ảnh</span>
              <p className="admin-detail-value">{selectedCategory.imageUrl || 'Chưa có ảnh.'}</p>
            </div>
          </div>
        )}
      </AdminModal>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t('admin.category_management.image')}</th>
              <th>{t('admin.category_management.name')}</th>
              <th>{t('admin.category_management.slug')}</th>
              <th>{t('admin.category_management.display_order')}</th>
              <th>{t('admin.category_management.status')}</th>
              <th className="admin-table-actions-head">{t('admin.category_management.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginateItems(categories, currentPage, ADMIN_PAGE_SIZE).items.map((category) => (
              <tr key={category.id}>
                <td className="admin-table-number">{category.id}</td>
                <td>
                  {category.imageUrl ? (
                    <img src={category.imageUrl} alt={category.name} className="admin-thumb admin-thumb--compact" />
                  ) : (
                    <div className="admin-thumb admin-thumb--compact"></div>
                  )}
                </td>
                <td className="admin-table-primary">{category.name}</td>
                <td>{category.slug}</td>
                <td>{category.displayOrder ?? 0}</td>
                <td>
                  <span className={`admin-badge ${category.active !== false ? 'active' : 'blocked'}`}>
                    {category.active !== false ? t('admin.category_management.visible') : t('admin.category_management.hidden')}
                  </span>
                </td>
                <td className="admin-table-actions-cell">
                  <div className="admin-action-group">
                    <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => setSelectedCategory(category)}>{t('admin.category_management.details')}</button>
                    <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => handleEdit(category)}>{t('admin.category_management.edit')}</button>
                    <button className="admin-btn admin-btn-danger admin-btn--small" onClick={() => handleDelete(category)}>{t('admin.category_management.delete')}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={paginateItems(categories, currentPage, ADMIN_PAGE_SIZE).totalPages}
          onPageChange={setCurrentPage}
        />
        {categories.length === 0 && !loading && (
          <div className="admin-empty">
            <h3>{t('admin.category_management.empty_title')}</h3>
            <p>{t('admin.category_management.empty_description')}</p>
            <button className="admin-btn admin-btn-primary" onClick={handleCreate}>{t('admin.category_management.add_category')}</button>
          </div>
        )}
      </div>
    </div>
  );
}
