import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../../wishlist/hooks/useWishlist.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { money } from '../../../utils/formatters.js';
import { translateColor, translateMaterial } from '../../../utils/uiText.js';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');

  const color = item.color || item.productColor || item.product?.color;
  const material = item.material || item.productMaterial || item.product?.material;
  const dimensions = item.dimensions || item.productDimensions || item.product?.dimensions;

  const imageUrl = item.productImageUrl || item.imageUrl || item.product?.imageUrl;
  const price = item.productPrice || item.price || item.product?.price || 0;
  const productId = item.productId || item.product?.id || item.id;

  const saved = isWishlisted(productId);

  const specText = [
    color && translateColor(color),
    material && translateMaterial(material),
    dimensions
  ].filter(Boolean).join('  ·  ');

  const handleWishlist = async () => {
    if (!user) {
      window.alert('Vui lòng đăng nhập để lưu sản phẩm yêu thích.');
      return;
    }
    try {
      // Create a minimal product object to toggle
      const mockProduct = item.product || {
        id: productId,
        productName: item.productName,
        price: price,
        imageUrl: imageUrl,
        color: color,
        material: material,
        dimensions: dimensions
      };
      await toggleWishlist(mockProduct);
    } catch (err) {
      window.alert(err.message || 'Không thể cập nhật danh sách yêu thích.');
    }
  };

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px', background: 'white', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'box-shadow 0.2s' }}>
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left: Product Thumbnail Image */}
        <div style={{ width: '160px', height: '120px', background: 'var(--color-bg-soft)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          {imageUrl ? (
            <img src={imageUrl} alt={item.productName} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--color-muted)', fontSize: '0.85rem' }}>Không có ảnh</div>
          )}
        </div>

        {/* Right: Info and Action Details */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 500, margin: 0, color: 'var(--color-text)', lineHeight: '1.4' }}>{item.productName}</h3>
            <strong style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text)' }}>{money(price * item.quantity)}</strong>
          </div>

          {specText && (
            <div style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
              {specText}
            </div>
          )}

          {/* Stock Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text)', fontSize: '0.85rem', fontWeight: 500, marginTop: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Còn hàng</span>
          </div>

          {/* Quantity selector and Delete row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '2px', background: '#fcfcfc', height: '36px' }}>
              <button className="btn btn-ghost" style={{ padding: '0 12px', fontSize: '1.1rem', color: 'var(--color-text)' }} onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={t('cart.decrease_quantity')}>-</button>
              <span style={{ width: '28px', textAlign: 'center', fontSize: '0.88rem', fontWeight: 500, color: 'var(--color-text)' }}>{item.quantity}</span>
              <button className="btn btn-ghost" style={{ padding: '0 12px', fontSize: '1.1rem', color: 'var(--color-text)' }} onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={t('cart.increase_quantity')}>+</button>
            </div>

            <button className="btn btn-ghost" style={{ padding: 0, border: 'none', color: 'var(--color-muted)', textDecoration: 'underline', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => removeFromCart(item.id)}>
              {t('cart.remove')}
            </button>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)' }} />

      {/* Footer Options row: Bookmark & Notes */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleWishlist}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text)',
            fontSize: '0.85rem',
            fontWeight: saved ? 500 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          {saved ? 'Đã lưu vào yêu thích' : 'Lưu vào danh sách yêu thích'}
        </button>

        <button
          type="button"
          onClick={() => setShowNote(!showNote)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text)',
            fontSize: '0.85rem',
            fontWeight: showNote ? 500 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
          </svg>
          Thêm ghi chú cho đơn hàng
        </button>
      </div>

      {showNote && (
        <div style={{ marginTop: '-4px' }}>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú cho sản phẩm này..."
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}
    </div>
  );
}
