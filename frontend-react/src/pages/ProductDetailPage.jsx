import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../services/productService.js';
import { useCart } from '../hooks/useCart.js';
import { money, truncate } from '../utils/formatters.js';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    getProductById(id)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="shell"><div className="loading-spinner" style={{ marginTop: 60 }} /></div>;

  if (!product) return (
    <div className="shell mt-3">
      <div className="empty-state">
        <h2>Không tìm thấy sản phẩm</h2>
        <button className="btn btn-primary mt-2" onClick={() => navigate('/')}>← Quay lại</button>
      </div>
    </div>
  );

  return (
    <div className="shell" style={{ padding: '32px 0 60px' }}>
      <button className="btn btn-ghost btn-sm mb-2" onClick={() => navigate(-1)}>← Quay lại</button>

      <div className="checkout-grid" style={{ marginTop: 0 }}>
        {/* Image */}
        <div>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.productName}
              style={{ width: '100%', border: '1px solid var(--line)', maxHeight: 420, objectFit: 'cover' }}
            />
          ) : (
            <div className="card-img-placeholder" style={{ height: 380, fontSize: '1.5rem' }}>
              NO IMAGE
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="panel">
          <p className="eyebrow">{product.category || 'Sản phẩm'}</p>
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', marginBottom: 12 }}>
            {product.productName}
          </h1>
          <p className="muted" style={{ marginBottom: 20 }}>
            {product.discription || product.description || 'Chưa có mô tả.'}
          </p>

          <div className="flex items-center gap-sm" style={{ marginBottom: 20 }}>
            <span className="price" style={{ fontSize: '2rem' }}>{money(product.price)}</span>
            <span className="muted">Còn {product.availability ?? '?'} sản phẩm</span>
          </div>

          {/* Qty */}
          <div className="flex items-center gap-sm mb-2">
            <label style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '.78rem' }}>Số lượng</label>
            <div className="qty-controls">
              <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <strong style={{ minWidth: 28, textAlign: 'center' }}>{qty}</strong>
              <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>

          <button
            id={`add-detail-${product.id}`}
            className="btn btn-primary btn-full"
            onClick={handleAdd}
            disabled={product.availability === 0}
          >
            {added ? '✓ Đã thêm vào giỏ!' : '+ Thêm vào giỏ hàng'}
          </button>

          {/* Meta */}
          <div style={{ marginTop: 24, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
            <p style={{ fontSize: '.82rem', fontWeight: 800, textTransform: 'uppercase' }}>
              ID: #{product.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
