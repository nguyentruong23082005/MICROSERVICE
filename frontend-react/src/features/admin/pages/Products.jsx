import { useEffect, useMemo, useRef, useState } from 'react';
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
import AdminModal from '../components/AdminModal.jsx';
import { getPageAfterProductDeletion } from '../utils/productDeletion.js';
import { ADMIN_PAGE_SIZE } from '../../../utils/constants.js';
import { MagnifierIcon, ShoppingCartIcon } from '../../../components/icons/index.js';

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
  const [deletingId, setDeletingId] = useState(null);
  const deletingIdRef = useRef(null);
  const [message, setMessage] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
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
    if (currentPage !== 1) {
      Promise.resolve().then(() => {
        setCurrentPage(1);
      });
    }
  }, [debouncedSearch, filterCategory, filterStock, currentPage]);

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
      Promise.resolve().then(() => {
        if (active) {
          load(currentPage, debouncedSearch, filterCategory, filterStock);
        }
      });
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

  const handleCreateClick = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowAdd(true);
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
    if (deletingId !== null) return;
    if (deletingIdRef.current !== null) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xoá sản phẩm "${name}"?`)) return;

    deletingIdRef.current = id;
    setDeletingId(id);
    setMessage(null);

    try {
      await adminDeleteProduct(id);
      const nextPage = getPageAfterProductDeletion({
        currentPage,
        itemCount: products.length,
      });
      setProducts(previous => previous.filter(product => product.id !== id));
      setMessage({ type: 'success', text: `Đã xoá sản phẩm "${name}".` });

      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        load(currentPage, debouncedSearch, filterCategory, filterStock);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể xoá sản phẩm.' });
    } finally {
      deletingIdRef.current = null;
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Sản phẩm</h1>
          <p className="admin-subtitle">Quản lý danh mục sản phẩm và kho hàng của bạn.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={handleCreateClick}>
          Thêm sản phẩm
        </button>
      </div>

      {message && (
        <div className={`admin-notice ${message.type === 'success' ? 'admin-notice-success' : 'admin-notice-error'}`}>
          {message.text}
        </div>
      )}

      <AdminModal
        isOpen={showAdd}
        title={editingId ? 'Sửa sản phẩm' : 'Sản phẩm mới'}
        subtitle="Cập nhật thông tin bán hàng, tồn kho và thuộc tính hiển thị cho storefront."
        size="lg"
        onClose={handleCancel}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn-outline" onClick={handleCancel}>Huỷ</button>
            <button type="submit" form="admin-product-form" className="admin-btn admin-btn-primary" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </>
        )}
      >
        <form id="admin-product-form" onSubmit={handleSubmit} className="admin-form-grid--wide">
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
            <select id="p-category" className="admin-input" name="category" value={form.category} onChange={handleChange}>
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
          <div className="admin-form-group admin-form-span-2">
            <label className="admin-label" htmlFor="p-img">Đường dẫn ảnh (URL)</label>
            <div className="admin-input-row">
              <input id="p-img" className="admin-input" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://" />
              <label className="admin-btn admin-btn-outline admin-upload-btn">
                Tải ảnh
                <input className="admin-visually-hidden" type="file" accept="image/*" onChange={handleImageUpload} />
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
        </form>
      </AdminModal>

      <AdminModal
        isOpen={Boolean(selectedProduct)}
        title={selectedProduct?.productName || 'Chi tiết sản phẩm'}
        subtitle="Thông tin đầy đủ của sản phẩm đang hiển thị trên hệ thống."
        size="lg"
        onClose={() => setSelectedProduct(null)}
        footer={(
          <>
            <button type="button" className="admin-btn admin-btn-outline" onClick={() => setSelectedProduct(null)}>Đóng</button>
            {selectedProduct && (
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => { handleEditClick(selectedProduct); setSelectedProduct(null); }}>
                Sửa sản phẩm
              </button>
            )}
          </>
        )}
      >
        {selectedProduct && (
          <div className="admin-detail-grid">
            <div className="admin-detail-item">
              <span className="admin-detail-label">Mã sản phẩm</span>
              <p className="admin-detail-value">#{selectedProduct.id}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">SKU</span>
              <p className="admin-detail-value">{selectedProduct.sku || '-'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Danh mục</span>
              <p className="admin-detail-value">{selectedProduct.categoryRef?.name || translateCategory(selectedProduct.category)}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Giá bán</span>
              <p className="admin-detail-value">{money(selectedProduct.price)}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Tồn kho</span>
              <p className="admin-detail-value">{selectedProduct.availability ?? 0} sản phẩm</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Phòng</span>
              <p className="admin-detail-value">{selectedProduct.room || '-'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Chất liệu</span>
              <p className="admin-detail-value">{selectedProduct.material || '-'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Màu sắc</span>
              <p className="admin-detail-value">{selectedProduct.color || '-'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Kích thước</span>
              <p className="admin-detail-value">{selectedProduct.dimensions || '-'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Bảo hành</span>
              <p className="admin-detail-value">{selectedProduct.warranty || '-'}</p>
            </div>
            <div className="admin-detail-item admin-form-span-2">
              <span className="admin-detail-label">Mô tả</span>
              <p className="admin-detail-value">{selectedProduct.discription || selectedProduct.description || 'Chưa có mô tả.'}</p>
            </div>
          </div>
        )}
      </AdminModal>

      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <MagnifierIcon className="admin-search-icon" size={16} strokeWidth={2} />
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
              <th className="admin-table-actions-head">Thao tác</th>
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
                      <div className="admin-table-primary">{product.productName}</div>
                      <div className="admin-table-secondary">Mã SKU: {product.sku || '-'}</div>
                    </div>
                  </div>
                </td>
                <td>{product.categoryRef?.name || translateCategory(product.category)}</td>
                <td>Còn {product.availability ?? 0} sản phẩm</td>
                <td className="admin-table-number">{money(product.price)}</td>
                <td>
                  <span className={`admin-badge ${product.availability > 0 ? 'active' : 'cancelled'}`}>
                    {product.availability > 0 ? 'Đang bán' : 'Hết hàng'}
                  </span>
                </td>
                <td className="admin-table-actions-cell">
                  <div className="admin-action-group">
                    <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => setSelectedProduct(product)}>Chi tiết</button>
                    <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => handleEditClick(product)}>Sửa</button>
                    <button
                      className="admin-btn admin-btn-danger admin-btn--small"
                      disabled={deletingId === product.id}
                      onClick={() => handleDelete(product.id, product.productName)}
                    >
                      {deletingId === product.id ? 'Đang xoá...' : 'Xoá'}
                    </button>
                  </div>
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
          <div className="admin-empty">
            <ShoppingCartIcon className="admin-empty-icon" size={48} />
            <h3>Không tìm thấy sản phẩm nào</h3>
            <p>Bắt đầu xây dựng danh mục bằng cách thêm sản phẩm mới.</p>
            <button className="admin-btn admin-btn-primary" onClick={handleCreateClick}>Thêm sản phẩm</button>
          </div>
        )}
      </div>
    </div>
  );
}
