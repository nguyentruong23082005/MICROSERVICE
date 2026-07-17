import { useEffect, useMemo, useState } from 'react';
import {
  adminCreateCoupon,
  adminDeleteCoupon,
  adminGetCoupons,
  adminUpdateCoupon,
} from '../services/adminService.js';
import { money } from '../../../utils/formatters.js';
import Pagination from '../components/Pagination.jsx';
import AdminModal from '../components/AdminModal.jsx';
import { paginateItems } from '../utils/paginateItems.js';
import { ADMIN_PAGE_SIZE } from '../../../utils/constants.js';

const EMPTY_FORM = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '',
  minOrderTotal: '0',
  active: true,
  startsAt: '',
  expiresAt: '',
};

function couponDiscountLabel(coupon) {
  if (coupon.discountType === 'PERCENT') {
    return `${coupon.discountValue}%`;
  }
  return money(Number(coupon.discountValue || 0));
}

function toForm(coupon) {
  return {
    code: coupon.code || '',
    description: coupon.description || '',
    discountType: coupon.discountType || 'PERCENT',
    discountValue: coupon.discountValue ?? '',
    minOrderTotal: coupon.minOrderTotal ?? '0',
    active: coupon.active !== false,
    startsAt: coupon.startsAt || '',
    expiresAt: coupon.expiresAt || '',
  };
}

function toPayload(form) {
  return {
    code: form.code.trim(),
    description: form.description.trim(),
    discountType: form.discountType,
    discountValue: Number(form.discountValue || 0),
    minOrderTotal: Number(form.minOrderTotal || 0),
    active: form.active,
    startsAt: form.startsAt || null,
    expiresAt: form.expiresAt || null,
  };
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);


  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return coupons;
    return coupons.filter((coupon) => (
      coupon.code?.toLowerCase().includes(term) ||
      coupon.description?.toLowerCase().includes(term)
    ));
  }, [coupons, search]);

  const load = () => {
    setLoading(true);
    setError(null);
    adminGetCoupons()
      .then((data) => setCoupons(Array.isArray(data) ? data : []))
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

  const handleEdit = (coupon) => {
    setEditingId(coupon.id);
    setForm(toForm(coupon));
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
        await adminUpdateCoupon(editingId, payload);
        setMessage({ type: 'success', text: 'Đã cập nhật mã giảm giá.' });
      } else {
        await adminCreateCoupon(payload);
        setMessage({ type: 'success', text: 'Đã tạo mã giảm giá mới.' });
      }
      resetForm();
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể lưu mã giảm giá.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Xóa mã ${coupon.code}?`)) return;
    setMessage(null);
    try {
      await adminDeleteCoupon(coupon.id);
      setMessage({ type: 'success', text: 'Đã xóa mã giảm giá.' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể xóa mã giảm giá.' });
    }
  };

  const activeCount = coupons.filter((coupon) => coupon.active !== false).length;
  const fixedCount = coupons.filter((coupon) => coupon.discountType === 'FIXED').length;

  return (
    <div className="admin-page-shell">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Mã giảm giá</h1>
          <p className="admin-subtitle">Tạo và quản lý coupon áp dụng trong checkout.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleCreate}>
          Thêm coupon
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
          <span className="metric-label">Đang hoạt động</span>
          <span className="metric-value">{loading ? '...' : activeCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Tổng coupon</span>
          <span className="metric-value">{loading ? '...' : coupons.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Giảm tiền mặt</span>
          <span className="metric-value">{loading ? '...' : fixedCount}</span>
        </div>
      </div>

      <AdminModal
        isOpen={showForm}
        title={editingId ? 'Sửa mã giảm giá' : 'Mã giảm giá mới'}
        subtitle="Thiết lập giá trị giảm, đơn tối thiểu, thời hạn và trạng thái sử dụng trong checkout."
        size="md"
        onClose={resetForm}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn-outline" onClick={resetForm}>Hủy</button>
            <button type="submit" form="admin-coupon-form" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu coupon'}
            </button>
          </>
        )}
      >
        <form id="admin-coupon-form" onSubmit={handleSubmit} className="admin-form-grid">
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="coupon-code">Mã</label>
            <input id="coupon-code" name="code" className="admin-input" value={form.code} onChange={handleChange} placeholder="Nhập mã giảm giá" required />
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="coupon-type">Loại giảm</label>
            <select id="coupon-type" name="discountType" className="admin-input" value={form.discountType} onChange={handleChange}>
              <option value="PERCENT">Phần trăm</option>
              <option value="FIXED">Số tiền cố định</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="coupon-value">Giá trị</label>
            <input id="coupon-value" type="number" min="0" name="discountValue" className="admin-input" value={form.discountValue} onChange={handleChange} required />
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="coupon-minimum">Đơn tối thiểu</label>
            <input id="coupon-minimum" type="number" min="0" name="minOrderTotal" className="admin-input" value={form.minOrderTotal} onChange={handleChange} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="coupon-start">Ngày bắt đầu</label>
            <input id="coupon-start" type="date" name="startsAt" className="admin-input" value={form.startsAt} onChange={handleChange} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="coupon-expire">Ngày hết hạn</label>
            <input id="coupon-expire" type="date" name="expiresAt" className="admin-input" value={form.expiresAt} onChange={handleChange} />
          </div>
          <div className="admin-form-group admin-form-span-2">
            <label className="admin-label" htmlFor="coupon-description">Mô tả</label>
            <input id="coupon-description" name="description" className="admin-input" value={form.description} onChange={handleChange} placeholder="Nhập mô tả mã giảm giá" />
          </div>
          <label className="admin-check-row">
            <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
            Đang kích hoạt
          </label>
        </form>
      </AdminModal>

      <AdminModal
        isOpen={Boolean(selectedCoupon)}
        title={selectedCoupon?.code || 'Chi tiết coupon'}
        subtitle="Kiểm tra điều kiện áp dụng và thời hạn của mã giảm giá."
        size="md"
        onClose={() => setSelectedCoupon(null)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn-outline" onClick={() => setSelectedCoupon(null)}>Đóng</button>
            {selectedCoupon && (
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => { handleEdit(selectedCoupon); setSelectedCoupon(null); }}>
                Sửa coupon
              </button>
            )}
          </>
        )}
      >
        {selectedCoupon && (
          <div className="admin-detail-grid">
            <div className="admin-detail-item">
              <span className="admin-detail-label">Mã</span>
              <p className="admin-detail-value">{selectedCoupon.code}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Giá trị</span>
              <p className="admin-detail-value">{couponDiscountLabel(selectedCoupon)}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Đơn tối thiểu</span>
              <p className="admin-detail-value">{money(Number(selectedCoupon.minOrderTotal || 0))}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Trạng thái</span>
              <p className="admin-detail-value">{selectedCoupon.active !== false ? 'Đang bật' : 'Đang tắt'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Bắt đầu</span>
              <p className="admin-detail-value">{selectedCoupon.startsAt || '-'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Hết hạn</span>
              <p className="admin-detail-value">{selectedCoupon.expiresAt || '-'}</p>
            </div>
            <div className="admin-detail-item admin-form-span-2">
              <span className="admin-detail-label">Mô tả</span>
              <p className="admin-detail-value">{selectedCoupon.description || 'Chưa có mô tả.'}</p>
            </div>
          </div>
        )}
      </AdminModal>

      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <input className="admin-search-input" value={search} onChange={(event) => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }} placeholder="Tìm mã giảm giá..." />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Mô tả</th>
              <th>Giá trị</th>
              <th>Đơn tối thiểu</th>
              <th>Thời hạn</th>
              <th>Trạng thái</th>
              <th className="admin-table-actions-head">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginateItems(filtered, currentPage, ADMIN_PAGE_SIZE).items.map((coupon) => (
              <tr key={coupon.id}>
                <td className="admin-table-primary">{coupon.code}</td>
                <td>{coupon.description || '-'}</td>
                <td className="admin-table-number">{couponDiscountLabel(coupon)}</td>
                <td>{money(Number(coupon.minOrderTotal || 0))}</td>
                <td>{coupon.startsAt || '-'} - {coupon.expiresAt || '-'}</td>
                <td>
                  <span className={`admin-badge ${coupon.active !== false ? 'active' : 'blocked'}`}>
                    {coupon.active !== false ? 'Đang bật' : 'Đang tắt'}
                  </span>
                </td>
                <td className="admin-table-actions-cell">
                  <div className="admin-action-group">
                    <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => setSelectedCoupon(coupon)}>Chi tiết</button>
                    <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => handleEdit(coupon)}>Sửa</button>
                    <button className="admin-btn admin-btn-danger admin-btn--small" onClick={() => handleDelete(coupon)}>Xóa</button>
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
            <h3>Chưa có mã giảm giá</h3>
            <p>Coupon tạo tại đây sẽ được dùng ở màn checkout.</p>
          </div>
        )}
      </div>
    </div>
  );
}
