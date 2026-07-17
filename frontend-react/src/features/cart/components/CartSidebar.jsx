import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../hooks/useCart.js';
import CartItem from './CartItem.jsx';
import { money } from '../../../utils/formatters.js';
import { XIcon } from '../../../components/icons/index.js';

export default function CartSidebar() {
  const { isSidebarOpen, closeSidebar, items, cartTotal } = useCart();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isSidebarOpen) return null;

  return (
    <>
      <div 
        style={{ position: 'fixed', inset: 0, background: 'rgba(17, 17, 17, 0.4)', zIndex: 999, backdropFilter: 'blur(4px)' }} 
        onClick={closeSidebar} 
      />
      
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '440px', background: 'var(--color-bg)', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-popup)', borderLeft: '1px solid var(--color-border)' }}>
        
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-card)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 500, fontFamily: 'var(--font-display)' }}>{t('cart.title')}</h2>
          <button className="btn btn-ghost" aria-label={t('cart.close')} style={{ padding: '8px', borderRadius: '50%' }} onClick={closeSidebar}>
            <XIcon size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '64px' }}>
              <p className="muted" style={{ marginBottom: '24px', fontSize: '0.95rem' }}>{t('cart.sidebar_empty')}</p>
              <button className="btn btn-primary" onClick={() => { closeSidebar(); navigate('/'); }}>
                {t('cart.view_collections')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {items.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div style={{ padding: '32px', borderTop: '1px solid var(--color-border)', background: 'var(--color-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontWeight: 500, fontSize: '1.1rem' }}>
              <span>{t('cart.subtotal')}</span>
              <span className="price" style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>{money(cartTotal)}</span>
            </div>
            <button 
              className="btn btn-primary btn-full" 
              style={{ height: '56px', fontSize: '1.1rem' }} 
              onClick={() => { closeSidebar(); navigate('/checkout'); }}
            >
              {t('cart.checkout')}
            </button>
            <button 
              className="btn btn-ghost btn-full" 
              style={{ marginTop: '12px' }} 
              onClick={() => { closeSidebar(); navigate('/cart'); }}
            >
              {t('cart.view_details')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

