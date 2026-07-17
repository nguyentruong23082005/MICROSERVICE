import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../features/cart/hooks/useCart.js';
import CartItem from '../features/cart/components/CartItem.jsx';
import { money } from '../utils/formatters.js';
import { ShoppingCartIcon } from '../components/icons/index.js';

export default function CartPage() {
  const { items, cartTotal } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="shell" style={{ marginTop: '32px', marginBottom: '80px' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 400, fontFamily: 'var(--font-display)', color: 'var(--color-text)', marginBottom: '8px' }}>
            Giỏ hàng của bạn
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem' }}>{items.length} sản phẩm</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/catalog')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text)',
            fontSize: '0.88rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            textDecoration: 'none',
            padding: 0
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Tiếp tục mua sắm
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '80px 24px', borderRadius: '12px' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--color-bg-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--color-border)' }}>
            <ShoppingCartIcon size={32} color="var(--color-muted)" />
          </div>
          <h2 style={{ marginBottom: '16px', fontWeight: 500, fontFamily: 'var(--font-display)' }}>{t('cart.empty')}</h2>
          <p className="muted" style={{ marginBottom: '32px', fontSize: '0.95rem' }}>{t('cart.empty_description')}</p>
          <button className="btn btn-primary" onClick={() => navigate('/catalog')}>{t('cart.continue_shopping')}</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Left Column */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
                 </div>
          </div>

          {/* Right Column (Summary) */}
          <div style={{ position: 'sticky', top: '100px', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '28px', background: 'white' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontFamily: 'var(--font-display)', fontWeight: 500, color: 'var(--color-text)' }}>Tóm tắt đơn hàng</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--color-muted)', fontSize: '0.88rem' }}>
              <span>Tạm tính ({items.length} sản phẩm)</span>
              <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{money(cartTotal)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--color-muted)', fontSize: '0.88rem' }}>
              <span>Phí vận chuyển</span>
              <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>Miễn phí</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '24px' }}>
              Giao hàng tiêu chuẩn (2–4 ngày)
            </div>
            
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 500, fontSize: '1.25rem', color: 'var(--color-text)' }}>
              <span>Tổng cộng</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{money(cartTotal)}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '28px', textAlign: 'right' }}>
              Đã bao gồm VAT
            </div>
            
            <button
              className="btn btn-primary btn-full"
              style={{
                height: '48px',
                fontSize: '0.95rem',
                background: 'var(--color-text)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/checkout')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

