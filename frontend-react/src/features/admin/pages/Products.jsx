import { useEffect, useMemo, useState } from 'react';
import {
  adminGetCategories,
  adminGetProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUploadImage,
} from '../services/adminService.js';
import { money } from '../../../utils/formatters.js';
import { translateCategory } from '../../../utils/uiText.js';
import { GATEWAY_BASE_URL } from '../../../api/client.js';


import Pagination from '../components/Pagination.jsx';
import { ADMIN_PAGE_SIZE } from '../../../utils/constants.js';

const EMPTY_FORM = {
  productName: '',
  price: '',
  category: '',
  availability: '',
  discription: '',
  imageUrl: '',
  room: '',
  material: '',
  color: '',
  dimensions: '',
  sku: '',
  warranty: '',
};

const uniqueTextOptions = (items, selector) =>
  Array.from(new Set(
    items
      .map(selector)
      .filter(value => typeof value === 'string' && value.trim().length > 0)
      .map(value => value.trim())
  )).sort((a, b) => a.localeCompare(b, 'vi'));

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterCategory, filterStock]);

  useEffect(() => {
    adminGetCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const load = (page, searchVal, catVal, stockVal) => {
    setLoading(true);
    const inStockParam = stockVal === 'in' ? true : stockVal === 'out' ? false : '';
    adminGetProducts(page - 1, ADMIN_PAGE_SIZE, {
      name: searchVal,
      category: catVal,
      inStock: inStockParam,
    })
      .then((data) => {
        if (data && data.content) {
          setProducts(data.content);
          setTotalPages(data.totalPages || 0);
        } else {
          setProducts(Array.isArray(data) ? data : []);
          setTotalPages(0);
        }
      })
      .catch(() => {
        setProducts([]);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    if (active) {
      load(currentPage, debouncedSearch, filterCategory, filterStock);
    }
    return () => { active = false; };
  }, [currentPage, debouncedSearch, filterCategory, filterStock]);

  const categoryOptions = useMemo(() => {
    if (categories.length > 0) {
      return categories.map(category => ({
        value: category.name,
        label: category.name,
        filterValue: category.slug || category.name,
      }));
    }

    return uniqueTextOptions(products, product => product.categoryRef?.name || product.category)
      .map(category => ({
        value: category,
        label: translateCategory(category),
        filterValue: category,
      }));
  }, [categories, products]);

  const roomOptions = useMemo(() => uniqueTextOptions(products, product => product.room), [products]);
  const materialOptions = useMemo(() => uniqueTextOptions(products, product => product.material), [products]);
  const colorOptions = useMemo(() => uniqueTextOptions(products, product => product.color), [products]);

  const filtered = products;

  const handleChange = (event) =>
    setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setMessage({ type: 'success', text: 'Đang tải ảnh lên...' });
      const res = await adminUploadImage(file);
      if (res && res.url) {
        const fullUrl = res.url.startsWith('/') ? `${GATEWAY_BASE_URL}${res.url}` : res.url;
        setForm((current) => ({
          ...current,
          imageUrl: fullUrl,
        }));
        setMessage({ type: 'success', text: 'Tải ảnh lên thành công!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể tải ảnh lên.' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        availability: Number(form.availability),
      };
      const selectedCategory = categories.find(category =>
        category.name === form.category || category.slug === form.category
      );

      if (selectedCategory) {
        payload.category = selectedCategory.name;
        payload.categoryRef = { id: selectedCategory.id };
      }

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
      load(currentPage, debouncedSearch, filterCategory, filterStock);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setForm({
      productName: product.productName || '',
      price: product.price || '',
      category: product.categoryRef?.name || product.category || '',
      availability: product.availability || '',
      discription: product.discription || product.description || '',
      imageUrl: product.imageUrl || '',
      room: product.room || '',
      material: product.material || '',
      color: product.color || '',
      dimensions: product.dimensions || '',
      sku: product.sku || '',
      warranty: product.warranty || '',
    });
    setShowAdd(true);
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowAdd(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xoá sản phẩm "${name}"?`)) return;

    try {
      await adminDeleteProduct(id);
      setMessage({ type: 'success', text: `Đã xoá sản phẩm "${name}".` });
      load(currentPage, debouncedSearch, filterCategory, filterStock);
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
              <input id="p-name" className="admin-input" name="productName" value={form.productName} onChange={handleChange} placeholder="Nhập tên sản phẩm" required />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-price">Giá bán (VND)</label>
              <input id="p-price" className="admin-input" type="number" name="price" value={form.price} onChange={handleChange} required min="0" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-category">Danh mục</label>
              <select id="p-category" className="admin-input" name="category" value={form.category} onChange={handleChange} style={{ height: '44px' }}>
                <option value="">Chọn danh mục</option>
                {categoryOptions.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-qty">Số lượng tồn kho</label>
              <input id="p-qty" className="admin-input" type="number" name="availability" value={form.availability} onChange={handleChange} min="0" />
            </div>
             <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
               <label className="admin-label" htmlFor="p-img">Đường dẫn ảnh (URL)</label>
               <div style={{ display: 'flex', gap: '8px' }}>
                 <input id="p-img" className="admin-input" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://" style={{ flex: 1 }} />
                 <label className="admin-btn admin-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap', padding: '10px 16px' }}>
                   Tải ảnh
                   <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                 </label>
               </div>
             </div>

            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-room">Phòng phù hợp</label>
              <input id="p-room" className="admin-input" name="room" list="p-room-options" value={form.room} onChange={handleChange} placeholder="Nhập hoặc chọn phòng" />
              <datalist id="p-room-options">
                {roomOptions.map(room => (
                  <option key={room} value={room} />
                ))}
              </datalist>
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-material">Chất liệu</label>
              <input id="p-material" className="admin-input" name="material" list="p-material-options" value={form.material} onChange={handleChange} placeholder="Nhập hoặc chọn chất liệu" />
              <datalist id="p-material-options">
                {materialOptions.map(material => (
                  <option key={material} value={material} />
                ))}
              </datalist>
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-color">Màu sắc</label>
              <input id="p-color" className="admin-input" name="color" list="p-color-options" value={form.color} onChange={handleChange} placeholder="Nhập hoặc chọn màu" />
              <datalist id="p-color-options">
                {colorOptions.map(color => (
                  <option key={color} value={color} />
                ))}
              </datalist>
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-dimensions">Kích thước</label>
              <input id="p-dimensions" className="admin-input" name="dimensions" value={form.dimensions} onChange={handleChange} placeholder="Nhập kích thước" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-sku">Mã SKU</label>
              <input id="p-sku" className="admin-input" name="sku" value={form.sku} onChange={handleChange} placeholder="Nhập mã SKU" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="p-warranty">Bảo hành</label>
              <input id="p-warranty" className="admin-input" name="warranty" value={form.warranty} onChange={handleChange} placeholder="Nhập thời hạn bảo hành" />
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
          <input type="text" className="admin-search-input" placeholder="Tìm sản phẩm..." value={search} onChange={event => setSearch(event.target.value)} />
        </div>
        <select className="admin-filter-select" aria-label="Lọc theo danh mục" value={filterCategory} onChange={event => setFilterCategory(event.target.value)}>
          <option value="">Tất cả danh mục</option>
          {categoryOptions.map(category => (
            <option key={category.filterValue} value={category.filterValue}>{category.label}</option>
          ))}
        </select>
        <select className="admin-filter-select" aria-label="Lọc theo trạng thái" value={filterStock} onChange={event => setFilterStock(event.target.value)}>
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
            {filtered.map(product => (
              <tr key={product.id}>
                <td>
                  <div className="admin-product-cell">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.productName} className="admin-thumb" />
                    ) : (
                      <div className="admin-thumb"></div>
                    )}
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--admin-black)' }}>{product.productName}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--admin-muted)' }}>Mã SKU: {product.sku || '-'}</div>
                    </div>
                  </div>
                </td>
                <td>{product.categoryRef?.name || translateCategory(product.category)}</td>
                <td>Còn {product.availability ?? 0} sản phẩm</td>
                <td>{money(product.price)}</td>
                <td>
                  <span className={`admin-badge ${product.availability > 0 ? 'active' : 'cancelled'}`}>
                    {product.availability > 0 ? 'Đang bán' : 'Hết hàng'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="admin-btn admin-btn-outline" style={{ padding: '6px 12px', fontSize: '12px', marginRight: '8px' }} onClick={() => handleEditClick(product)}>Sửa</button>
                  <button className="admin-btn admin-btn-outline" style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--admin-danger)', color: 'var(--admin-danger-text)' }} onClick={() => handleDelete(product.id, product.productName)}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        {filtered.length === 0 && loading === false && (
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
