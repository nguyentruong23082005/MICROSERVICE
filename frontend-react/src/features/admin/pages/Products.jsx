import { useState, useEffect } from 'react';
import { adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct } from '../services/adminService.js';
import { money } from '../../../utils/formatters.js';
import { translateCategory, PRODUCT_CATEGORIES, ROOM_CATEGORIES, PRODUCT_MATERIALS, PRODUCT_COLORS } from '../../../utils/uiText.js';

const EMPTY_FORM = {
  productName: '', price: '', category: '', availability: '',
  discription: '', imageUrl: '',
  room: '', material: '', color: '', dimensions: '', sku: '', warranty: '',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState('');

  const filtered = products.filter(p =>
    (!search || p.productName?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCategory || p.category === filterCategory) &&
    (!filterStock ||
      (filterStock === 'in' && p.availability > 0) ||
      (filterStock === 'out' && p.availability === 0))
  );

  const load = () => {
    setLoading(true);
    adminGetProducts()
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) load();
    });
    return () => { active = false; };
  }, []);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        availability: Number(form.availability),
      };
      if (editingId) {
        await adminUpdateProduct(editingId, payload);
        setMessage({ type: 'success', text: `Đã cập nhật sản phẩm "${form.productName}" thành công.` });
      } else {
        await adminCreateProduct(payload);
        setMessage({ type: 'success', text: `Đã tạo sản phẩm "${form.productName}" thành công.` });
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowAdd(false);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (p) => {
    setEditingId(p.id);
    setForm({
      productName: p.productName || '',
      price: p.price || '',
      category: p.category || '',
      availability: p.availability || '',
      discription: p.discription || p.description || '',
      imageUrl: p.imageUrl || '',
      room: p.room || '',
      material: p.material || '',
      color: p.color || '',
      dimensions: p.dimensions || '',
      sku: p.sku || '',
      warranty: p.warranty || '',
    });
    setShowAdd(true);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowAdd(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Bạn có chắc chắn muốn xoá sản phẩm "${name}"?`)) return;
    try {

      await adminDeleteProduct(id);
      setMessage({ type: 'success', text: `Đã xoá sản phẩm "${name}".` });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };


  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Sản phẩm</h1>
          <p className="admin-subtitle">Quản lý danh mục sản phẩm và kho hàng của bạn.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Đóng' : 'Thêm sản phẩm'}
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: message.type === 'success' ? 'var(--admin-mint)' : 'var(--admin-danger)', color: message.type === 'success' ? 'var(--admin-black)' : 'var(--admin-danger-text)' }}>
          {message.text}
        </div>
      )}

      {showAdd && (
        <div className="admin-card" style={{ marginBottom: '32px' }}>
          <h2 className="admin-page-title-small" style={{ marginBottom: '24px' }}>{editingId ? 'Sửa sản phẩm' : 'Sản phẩm mới'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-name">Tên sản phẩm</label>
              <input id="p-name" className="admin-input" name="productName" value={form.productName} onChange={handleChange} placeholder="Sofa Cloud Linen" required />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-price">Giá bán (VND)</label>
              <input id="p-price" className="admin-input" type="number" name="price" value={form.price} onChange={handleChange} required min="0" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-category">Danh mục</label>
              <select id="p-category" className="admin-input" name="category" value={form.category} onChange={handleChange} style={{ height: '44px' }}>
                <option value="">Chọn danh mục</option>
                {PRODUCT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-qty">Số lượng tồn kho</label>
              <input id="p-qty" className="admin-input" type="number" name="availability" value={form.availability} onChange={handleChange} min="0" />
            </div>
            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-label" htmlFor="p-img">Đường dẫn ảnh (URL)</label>
              <input id="p-img" className="admin-input" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://" />
            </div>

            {/* ── Furniture domain fields ──────────────────────────────── */}
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-room">Phòng phù hợp</label>
              <select id="p-room" className="admin-input" name="room" value={form.room} onChange={handleChange} style={{ height: '44px' }}>
                <option value="">Chọn phòng</option>
                {ROOM_CATEGORIES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-material">Chất liệu</label>
              <select id="p-material" className="admin-input" name="material" value={form.material} onChange={handleChange} style={{ height: '44px' }}>
                <option value="">Chọn chất liệu</option>
                {PRODUCT_MATERIALS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-color">Màu sắc</label>
              <select id="p-color" className="admin-input" name="color" value={form.color} onChange={handleChange} style={{ height: '44px' }}>
                <option value="">Chọn màu</option>
                {PRODUCT_COLORS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-dimensions">Kích thước</label>
              <input id="p-dimensions" className="admin-input" name="dimensions" value={form.dimensions} onChange={handleChange} placeholder="W120 x D60 x H75 cm" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-sku">Mã SKU</label>
              <input id="p-sku" className="admin-input" name="sku" value={form.sku} onChange={handleChange} placeholder="FQ-001" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-warranty">Bảo hành</label>
              <input id="p-warranty" className="admin-input" name="warranty" value={form.warranty} onChange={handleChange} placeholder="24 tháng" />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button type="button" className="admin-btn admin-btn-outline" onClick={handleCancel}>Huỷ</button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" className="admin-search-input" placeholder="Tìm sản phẩm..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="admin-filter-select" aria-label="Lọc theo danh mục" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {PRODUCT_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <select className="admin-filter-select" aria-label="Lọc theo trạng thái" value={filterStock} onChange={e => setFilterStock(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="in">Còn hàng</option>
          <option value="out">Hết hàng</option>
        </select>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th>Tồn kho</th>
              <th>Giá bán</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="admin-product-cell">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.productName} className="admin-thumb" />
                    ) : (
                      <div className="admin-thumb"></div>
                    )}
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--admin-black)' }}>{p.productName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--admin-muted)' }}>Mã SKU: FQ-{p.id}</div>
                    </div>
                  </div>
                </td>
                <td>{translateCategory(p.category)}</td>
                <td>Còn {p.availability ?? 0} sản phẩm</td>
                <td>{money(p.price)}</td>
                <td>
                  <span className={`admin-badge ${p.availability > 0 ? 'active' : 'cancelled'}`}>
                    {p.availability > 0 ? 'Đang bán' : 'Hết hàng'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="admin-btn admin-btn-outline" style={{ padding: '6px 12px', fontSize: '12px', marginRight: '8px' }} onClick={() => handleEditClick(p)}>Sửa</button>
                  <button className="admin-btn admin-btn-outline" style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--admin-danger)', color: 'var(--admin-danger-text)' }} onClick={() => handleDelete(p.id, p.productName)}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && loading === false && (
           <div className="admin-empty" style={{ borderTop: '1px solid var(--admin-border)' }}>
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-muted)', marginBottom: '16px' }}><path d="M20 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 20 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
             <h3>Không tìm thấy sản phẩm nào</h3>
             <p>Bắt đầu xây dựng danh mục bằng cách thêm sản phẩm mới.</p>
             <button className="admin-btn admin-btn-primary" onClick={() => setShowAdd(true)}>Thêm sản phẩm</button>
           </div>
        )}
      </div>
    </div>
  );
}
