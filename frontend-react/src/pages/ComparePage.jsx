import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompare } from '../features/compare/index.js';
import { getProductById } from '../features/products/services/productService.js';
import { money } from '../utils/formatters.js';
import { translateCategory, translateColor, translateMaterial } from '../utils/uiText.js';

const BASE_ROWS = [
  { key: 'price', label: 'Giá', value: (product) => money(product.price || 0) },
  {
    key: 'category',
    label: 'Danh mục',
    value: (product) => product.categoryRef?.name || translateCategory(product.category, 'Chưa phân loại'),
  },
  { key: 'material', label: 'Chất liệu', value: (product) => translateMaterial(product.material, 'Chưa cập nhật') },
  { key: 'color', label: 'Màu sắc', value: (product) => translateColor(product.color, 'Chưa cập nhật') },
  { key: 'dimensions', label: 'Kích thước', value: (product) => product.dimensions || 'Chưa cập nhật' },
  { key: 'warranty', label: 'Bảo hành', value: (product) => product.warranty || 'Chưa cập nhật' },
  {
    key: 'availability',
    label: 'Tồn kho',
    value: (product) => Number(product.availability || 0) > 0 ? 'Còn hàng' : 'Hết hàng',
  },
];

function collectSpecificationRows(products) {
  const byKey = new Map();
  products.forEach((product) => {
    (product.specifications || []).forEach((spec) => {
      const key = spec.specKey || spec.specLabel;
      if (key && !byKey.has(key)) {
        byKey.set(key, {
          key: `spec-${key}`,
          label: spec.specLabel || key,
          value: (current) => {
            const matched = (current.specifications || []).find((item) => (
              (item.specKey || item.specLabel) === key
            ));
            return matched?.specValue || 'Chưa cập nhật';
          },
        });
      }
    });
  });
  return [...byKey.values()];
}

export default function ComparePage() {
  const navigate = useNavigate();
  const { productIds, removeFromCompare, clearCompare, maxItems } = useCompare();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(productIds.length > 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (!active) return null;
      if (productIds.length === 0) {
        setProducts([]);
        setError(null);
        setLoading(false);
        return null;
      }

      setLoading(true);
      setError(null);
      return Promise.all(productIds.map((id) => (
        getProductById(id).catch((err) => {
          if (err.status === 404) return null;
          throw err;
        })
      )))
        .then((data) => {
          if (!active) return;
          const nextProducts = data.filter(Boolean);
          const liveIds = new Set(nextProducts.map((product) => Number(product.id)));
          productIds.forEach((id) => {
            if (!liveIds.has(Number(id))) {
              removeFromCompare(id);
            }
          });
          setProducts(nextProducts);
        })
        .catch((err) => {
          if (active) setError(err.message || 'Không thể tải dữ liệu so sánh.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });

    return () => { active = false; };
  }, [productIds, removeFromCompare]);

  const rows = useMemo(
    () => [...BASE_ROWS, ...collectSpecificationRows(products)],
    [products]
  );

  if (productIds.length === 0) {
    return (
      <div className="shell section-padding">
        <div className="empty-state">
          <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Chưa có sản phẩm để so sánh</h1>
          <p className="muted" style={{ marginBottom: '24px' }}>
            Chọn biểu tượng so sánh trên sản phẩm để đặt cạnh nhau các thông số quan trọng.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Khám phá sản phẩm</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shell section-padding">
        <div className="loading-spinner" aria-label="Đang tải bảng so sánh" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell section-padding">
        <div className="empty-state">
          <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Không thể tải bảng so sánh</h1>
          <p className="muted" style={{ marginBottom: '24px' }}>{error}</p>
          <button className="btn btn-outline" onClick={() => navigate('/')}>Về danh sách sản phẩm</button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="shell section-padding">
        <div className="empty-state">
          <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>Sản phẩm so sánh không còn tồn tại</h1>
          <button className="btn btn-primary" onClick={clearCompare}>Làm mới danh sách</button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell section-padding">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div>
          <p className="eyebrow">So sánh sản phẩm</p>
          <h1 style={{ fontSize: '2rem' }}>{products.length}/{maxItems} sản phẩm</h1>
          <p className="muted" style={{ marginTop: '8px' }}>
            Dữ liệu được tải lại từ catalog, không dùng snapshot cũ trong localStorage.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => navigate('/')}>Thêm sản phẩm</button>
          <button className="btn btn-ghost" onClick={clearCompare}>Xóa tất cả</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${220 + products.length * 220}px` }}>
          <thead>
            <tr>
              <th style={{ width: '220px', textAlign: 'left', padding: '20px', borderBottom: '1px solid var(--color-border)' }}>Tiêu chí</th>
              {products.map((product) => (
                <th key={product.id} style={{ textAlign: 'left', padding: '20px', borderBottom: '1px solid var(--color-border)', verticalAlign: 'top' }}>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', background: 'var(--color-bg-soft)' }}>
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', padding: 0, fontSize: '1rem', fontWeight: 600 }} onClick={() => navigate(`/products/${product.id}`)}>
                      {product.productName}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => removeFromCompare(product.id)}>
                      Xóa
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th style={{ textAlign: 'left', padding: '16px 20px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-muted)', fontWeight: 500 }}>
                  {row.label}
                </th>
                {products.map((product) => (
                  <td key={`${row.key}-${product.id}`} style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', verticalAlign: 'top' }}>
                    {row.value(product)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
