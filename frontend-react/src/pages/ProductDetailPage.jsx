import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../features/products/services/productService.js';
import { useCart } from '../features/cart/hooks/useCart.js';
import { RecommendationList } from '../features/recommendations/index.js';
import { money } from '../utils/formatters.js';
import {
  translateCategory,
  translateColor,
  translateMaterial,
} from '../utils/uiText.js';


export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (!active) return;
      setLoading(true);
      setError(null);
      getProductById(id)
        .then(d => {
          if (active) setProduct(d);
        })
        .catch(err => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });

    return () => { active = false; };
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    setAdding(true);
    addToCart(product, quantity);
    setTimeout(() => {
      setAdding(false);
      navigate('/cart');
    }, 600);
  };

  if (loading) return <div className="shell section-padding"><div className="loading-spinner" aria-label="Đang tải sản phẩm" /></div>;
  
  if (error) return (
    <div className="shell section-padding">
      <div className="empty-state">
        <h2 style={{ marginBottom: '16px' }}>Không thể tải sản phẩm</h2>
        <p>{error}</p>
        <button className="btn btn-outline" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>Về trang chủ</button>
      </div>
    </div>
  );

  if (!product) return null;

  return (
    <div className="shell section-padding">
      <div className="grid-2">
        {/* Left: Image */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--color-bg-soft)', display: 'grid', placeItems: 'center', minHeight: '500px' }}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ color: 'var(--color-muted)' }}>Chưa có hình ảnh</div>
          )}
        </div>

        {/* Right: Info */}
        <div style={{ padding: '24px 0' }}>
          <p className="eyebrow">{translateCategory(product.category, 'Bộ sưu tập Furniq')}</p>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{product.productName}</h1>
          <div style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '32px' }}>{money(product.price)}</div>
          
          <p style={{ color: 'var(--color-muted)', marginBottom: '32px', fontSize: '1.05rem', lineHeight: 1.7 }}>
            {product.discription || 'Một thiết kế nội thất tinh tế, mang lại cảm giác ấm áp và tối giản cho không gian sống hiện đại.'}
          </p>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '32px', marginBottom: '32px' }}>
            {product.material && (
              <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Chất liệu:</span>
                <span style={{ padding: '4px 14px', border: '1px solid var(--color-text)', borderRadius: 'var(--radius-pill)', fontSize: '0.9rem' }}>
                  {translateMaterial(product.material)}
                </span>
              </div>
            )}
            {product.color && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Màu sắc:</span>
                <span style={{ padding: '4px 14px', border: '1px solid var(--color-text)', borderRadius: 'var(--radius-pill)', fontSize: '0.9rem' }}>
                  {translateColor(product.color)}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-md" style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', padding: '4px' }}>
              <button className="btn btn-ghost" style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)' }} onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm số lượng">-</button>
              <span style={{ width: '40px', textAlign: 'center', fontWeight: 500 }}>{quantity}</span>
              <button className="btn btn-ghost" style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)' }} onClick={() => setQuantity(quantity + 1)} aria-label="Tăng số lượng">+</button>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, height: '56px', fontSize: '1.1rem' }} 
              onClick={handleAdd}
              disabled={adding || product.availability === 0}
            >
              {adding ? 'Đang thêm...' : product.availability > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
            </button>
          </div>

          {/* Details section — real data from API */}
          <div style={{ borderTop: '1px solid var(--color-border)' }}>
            {product.dimensions && (
              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 500, marginBottom: '6px' }}>Kích thước</div>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>{product.dimensions}</div>
              </div>
            )}
            {(product.material || product.warranty) && (
              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontWeight: 500, marginBottom: '6px' }}>Chất liệu & bảo hành</div>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                  {product.material && <div>Chất liệu: {translateMaterial(product.material)}</div>}
                  {product.warranty && <div>Bảo hành: {product.warranty}</div>}
                </div>
              </div>
            )}
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: 500 }}>Giao hàng miễn phí toàn quốc</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '64px', borderTop: '1px solid var(--color-border)', paddingTop: '40px' }}>
        <RecommendationList product={product} />
      </div>
    </div>
  );
}

