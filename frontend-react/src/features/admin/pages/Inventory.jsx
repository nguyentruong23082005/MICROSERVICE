import { useEffect, useState } from 'react';
import { adminGetProducts, adminUpdateProduct } from '../services/adminService.js';
import { money } from '../../../utils/formatters.js';
import { translateCategory } from '../../../utils/uiText.js';

import Pagination from '../components/Pagination.jsx';
import { ADMIN_PAGE_SIZE } from '../../../utils/constants.js';

function stockBadge(product) {
  const availability = Number(product.availability || 0);
  if (availability === 0) {
    return {
      text: 'Hết hàng',
      style: { background: '#fff5f5', color: '#e03131', borderColor: '#ffc9c9' },
    };
  }
  if (availability < 8) {
    return {
      text: 'Sắp hết',
      style: { background: '#fff9db', color: '#f08c00', borderColor: '#ffe066' },
    };
  }
  return {
    text: 'Đầy đủ',
    style: { background: '#ebfbee', color: '#2b8a3e', borderColor: '#b2f2bb' },
  };
}

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [stockChanges, setStockChanges] = useState({});
  const [message, setMessage] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const load = (page) => {
    setLoading(true);
    setError(null);
    adminGetProducts(page - 1, ADMIN_PAGE_SIZE)
      .then(data => {
        if (data && data.content) {
          const list = data.content;
          setProducts(list);
          setTotalPages(data.totalPages || 0);
          setStockChanges(prev => {
            const next = { ...prev };
            list.forEach(p => {
              if (next[p.id] === undefined) {
                next[p.id] = p.availability || 0;
              }
            });
            return next;
          });
        } else {
          const list = Array.isArray(data) ? data : [];
          setProducts(list);
          setTotalPages(0);
          setStockChanges(prev => {
            const next = { ...prev };
            list.forEach(p => {
              if (next[p.id] === undefined) {
                next[p.id] = p.availability || 0;
              }
            });
            return next;
          });
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    if (active) {
      load(currentPage);
    }
    return () => { active = false; };
  }, [currentPage]);

  const handleStockInputChange = (productId, value) => {
    const parsedValue = parseInt(value, 10);
    setStockChanges(current => ({
      ...current,
      [productId]: Number.isNaN(parsedValue) ? 0 : Math.max(0, parsedValue),
    }));
  };

  const handleAdjustStock = (productId, amount) => {
    setStockChanges(current => ({
      ...current,
      [productId]: Math.max(0, (current[productId] ?? 0) + amount),
    }));
  };

  const handleUpdateStock = async (product) => {
    const newStock = stockChanges[product.id];
    if (newStock === product.availability) return;

    setUpdatingId(product.id);
    setMessage(null);

    try {
      await adminUpdateProduct(product.id, {
        ...product,
        availability: newStock,
      });
      setMessage({ type: 'success', text: `Đã cập nhật tồn kho cho "${product.productName}" thành ${newStock}.` });
      setProducts(current => current.map(item => item.id === product.id ? { ...item, availability: newStock } : item));
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi cập nhật tồn kho.' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">Quản lý kho hàng</h1>
          <p className="admin-subtitle">Theo dõi và cập nhật số lượng tồn kho sản phẩm.</p>
        </div>
      </div>

      {message && (
        <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: message.type === 'success' ? 'var(--admin-mint)' : 'var(--admin-danger)', color: message.type === 'success' ? 'var(--admin-black)' : 'var(--admin-danger-text)' }}>
          {message.text}
        </div>
      )}

      {error && <div className="admin-notice admin-notice-error">{error}</div>}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá bán</th>
              <th>Mức tồn kho</th>
              <th>Số lượng trong kho</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => {
              const currentStock = stockChanges[product.id] ?? product.availability;
              const hasChanged = currentStock !== product.availability;
              const badge = stockBadge(product);

              return (
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
                  <td>{translateCategory(product.category, 'Chưa phân loại')}</td>
                  <td>{money(product.price)}</td>
                  <td>
                    <span className="admin-badge" style={badge.style}>
                      {badge.text}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button className="admin-btn admin-btn-outline" style={{ padding: '4px 8px', minWidth: '28px', fontSize: '14px', margin: 0 }} onClick={() => handleAdjustStock(product.id, -1)} disabled={updatingId === product.id}>
                        -
                      </button>
                      <input type="number" min="0" value={currentStock} onChange={(event) => handleStockInputChange(product.id, event.target.value)} style={{ width: '60px', textAlign: 'center', padding: '6px', border: '1px solid var(--admin-border)', borderRadius: '6px' }} disabled={updatingId === product.id} />
                      <button className="admin-btn admin-btn-outline" style={{ padding: '4px 8px', minWidth: '28px', fontSize: '14px', margin: 0 }} onClick={() => handleAdjustStock(product.id, 1)} disabled={updatingId === product.id}>
                        +
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className={`admin-btn ${hasChanged ? 'admin-btn-primary' : 'admin-btn-outline'}`} style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleUpdateStock(product)} disabled={updatingId === product.id || !hasChanged}>
                      {updatingId === product.id ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        {products.length === 0 && !loading && (
          <div className="admin-empty" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <h3>Không có sản phẩm nào</h3>
            <p>Hệ thống chưa có sản phẩm nào để hiển thị thông tin tồn kho.</p>
          </div>
        )}
      </div>
    </div>
  );
}
