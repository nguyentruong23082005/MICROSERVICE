import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminGetProducts, adminUpdateProduct } from '../services/adminService.js';
import { money } from '../../../utils/formatters.js';
import { translateCategory } from '../../../utils/uiText.js';

import Pagination from '../components/Pagination.jsx';
import AdminModal from '../components/AdminModal.jsx';
import { ADMIN_PAGE_SIZE } from '../../../utils/constants.js';

function stockBadge(product, t) {
  const availability = Number(product.availability || 0);
  if (availability === 0) {
    return {
      text: t('admin.inventory_management.out_of_stock'),
      style: { background: '#fff5f5', color: '#e03131', borderColor: '#ffc9c9' },
    };
  }
  if (availability < 8) {
    return {
      text: t('admin.inventory_management.low_stock'),
      style: { background: '#fff9db', color: '#f08c00', borderColor: '#ffe066' },
    };
  }
  return {
    text: t('admin.inventory_management.in_stock'),
    style: { background: '#ebfbee', color: '#2b8a3e', borderColor: '#b2f2bb' },
  };
}

export default function Inventory() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [stockChanges, setStockChanges] = useState({});
  const [message, setMessage] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
      Promise.resolve().then(() => {
        if (active) {
          load(currentPage);
        }
      });
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
      setMessage({
        type: 'success',
        text: t('admin.inventory_management.update_success', {
          name: product.productName,
          count: newStock,
        }),
      });
      setProducts(current => current.map(item => item.id === product.id ? { ...item, availability: newStock } : item));
    } catch (err) {
      setMessage({ type: 'error', text: err.message || t('admin.inventory_management.update_error') });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">{t('admin.inventory_management.title')}</h1>
          <p className="admin-subtitle">{t('admin.inventory_management.description')}</p>
        </div>
      </div>

      {message && (
        <div className={`admin-notice ${message.type === 'success' ? 'admin-notice-success' : 'admin-notice-error'}`}>
          {message.text}
        </div>
      )}

      {error && <div className="admin-notice admin-notice-error">{error}</div>}

      <AdminModal
        isOpen={Boolean(selectedProduct)}
        title={selectedProduct?.productName || 'Chi tiết tồn kho'}
        subtitle="Đối chiếu tồn kho, SKU, danh mục và giá bán của sản phẩm."
        size="md"
        onClose={() => setSelectedProduct(null)}
        footer={<button type="button" className="admin-btn admin-btn-outline" onClick={() => setSelectedProduct(null)}>Đóng</button>}
      >
        {selectedProduct && (
          <div className="admin-detail-grid">
            <div className="admin-detail-item admin-form-span-2">
              <span className="admin-detail-label">Sản phẩm</span>
              <p className="admin-detail-value">{selectedProduct.productName}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">SKU</span>
              <p className="admin-detail-value">{selectedProduct.sku || '-'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Danh mục</span>
              <p className="admin-detail-value">{translateCategory(selectedProduct.category, t('admin.inventory_management.uncategorized'))}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Giá bán</span>
              <p className="admin-detail-value">{money(selectedProduct.price)}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Tồn kho hiện tại</span>
              <p className="admin-detail-value">{selectedProduct.availability || 0}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Trạng thái</span>
              <p className="admin-detail-value">{stockBadge(selectedProduct, t).text}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">ID sản phẩm</span>
              <p className="admin-detail-value">#{selectedProduct.id}</p>
            </div>
            <div className="admin-detail-item admin-form-span-2">
              <span className="admin-detail-label">Mô tả</span>
              <p className="admin-detail-value">{selectedProduct.description || selectedProduct.productDescription || 'Chưa có mô tả.'}</p>
            </div>
          </div>
        )}
      </AdminModal>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.inventory_management.product')}</th>
              <th>{t('admin.inventory_management.category')}</th>
              <th>{t('admin.inventory_management.price')}</th>
              <th>{t('admin.inventory_management.stock_level')}</th>
              <th>{t('admin.inventory_management.quantity')}</th>
              <th className="admin-table-actions-head">{t('admin.inventory_management.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => {
              const currentStock = stockChanges[product.id] ?? product.availability;
              const hasChanged = currentStock !== product.availability;
              const badge = stockBadge(product, t);

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
                        <div className="admin-table-primary">{product.productName}</div>
                        <div className="admin-table-secondary">
                          {t('admin.inventory_management.sku', { sku: product.sku || '-' })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{translateCategory(product.category, t('admin.inventory_management.uncategorized'))}</td>
                  <td>{money(product.price)}</td>
                  <td>
                    <span className="admin-badge" style={badge.style}>
                      {badge.text}
                    </span>
                  </td>
                  <td>
                    <div className="admin-stock-control">
                      <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => handleAdjustStock(product.id, -1)} disabled={updatingId === product.id} aria-label="Giảm tồn kho">
                        −
                      </button>
                      <input className="admin-stock-input" type="number" min="0" value={currentStock} onChange={(event) => handleStockInputChange(product.id, event.target.value)} disabled={updatingId === product.id} aria-label="Số lượng tồn kho" />
                      <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => handleAdjustStock(product.id, 1)} disabled={updatingId === product.id} aria-label="Tăng tồn kho">
                        +
                      </button>
                    </div>
                  </td>
                  <td className="admin-table-actions-cell">
                    <div className="admin-action-group">
                      <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => setSelectedProduct(product)}>Chi tiết</button>
                      <button className={`admin-btn admin-btn--small ${hasChanged ? 'admin-btn-primary' : 'admin-btn-outline'}`} onClick={() => handleUpdateStock(product)} disabled={updatingId === product.id || !hasChanged}>
                        {updatingId === product.id
                          ? t('admin.inventory_management.saving')
                          : t('admin.inventory_management.save')}
                      </button>
                    </div>
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
          <div className="admin-empty">
            <h3>{t('admin.inventory_management.empty_title')}</h3>
            <p>{t('admin.inventory_management.empty_description')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
