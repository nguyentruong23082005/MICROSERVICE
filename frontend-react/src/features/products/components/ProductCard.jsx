import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useCart } from '../../cart/hooks/useCart.js';
import { useWishlist } from '../../wishlist/hooks/useWishlist.js';
import { useCompare } from '../../compare/index.js';
import { money } from '../../../utils/formatters.js';
import { translateCategory } from '../../../utils/uiText.js';
import { HeartIcon, RefreshIcon } from '../../../components/icons/index.js';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, pendingProductId, toggleWishlist } = useWishlist();
  const { isCompared, toggleCompare } = useCompare();
  const categoryLabel = product.categoryRef?.name || translateCategory(product.category);
  const saved = isWishlisted(product.id);
  const wishlistBusy = pendingProductId === Number(product.id);
  const compared = isCompared(product.id);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) {
      window.alert(t('product.wishlist_login_required'));
      return;
    }
    try {
      await toggleWishlist(product);
    } catch (err) {
      window.alert(err.message || t('product.wishlist_update_error'));
    }
  };

  const handleCompare = (e) => {
    e.stopPropagation();
    const result = toggleCompare(product);
    if (!result.ok && result.reason === 'limit') {
      window.alert(t('product.compare_limit'));
    }
  };

  return (
    <article
      className="card"
      onClick={() => navigate(`/products/${product.id}`)}
      style={{
        cursor: 'pointer',
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        position: 'relative',
        transition: 'var(--transition-style)',
      }}
      aria-label={t('product.card_label', { name: product.productName })}
    >
      <button
        type="button"
        className="btn btn-ghost btn-icon-round"
        onClick={handleWishlist}
        disabled={wishlistBusy}
        aria-pressed={saved}
        aria-label={saved ? t('product.remove_from_wishlist') : t('product.save_to_wishlist')}
        title={saved ? t('product.remove_from_wishlist') : t('product.save_to_wishlist')}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: saved ? 'var(--color-wood)' : 'rgba(255, 255, 255, 0.9)',
          color: saved ? '#ffffff' : 'var(--color-text)',
          border: '1px solid var(--color-border)',
          zIndex: 2,
        }}
      >
        <HeartIcon
          size={18}
          color={saved ? '#ffffff' : 'var(--color-text)'}
          fill={saved ? '#ffffff' : 'none'}
          strokeWidth={2}
        />
      </button>

      <button
        type="button"
        className="btn btn-ghost btn-icon-round"
        onClick={handleCompare}
        aria-pressed={compared}
        aria-label={compared ? t('product.remove_from_compare') : t('product.add_to_compare')}
        title={compared ? t('product.remove_from_compare') : t('product.add_to_compare')}
        style={{
          position: 'absolute',
          top: '72px',
          right: '24px',
          background: compared ? 'var(--color-olive)' : 'rgba(255, 255, 255, 0.9)',
          color: compared ? '#ffffff' : 'var(--color-text)',
          border: '1px solid var(--color-border)',
          zIndex: 2,
        }}
      >
        <RefreshIcon
          size={18}
          color={compared ? '#ffffff' : 'var(--color-text)'}
          strokeWidth={2}
        />
      </button>

      <div style={{ aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', background: 'var(--color-bg-soft)', marginBottom: '16px' }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.productName} loading="lazy" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--color-muted)', fontSize: '0.85rem' }}>{t('product.no_image')}</div>
        )}
      </div>

      <div style={{ padding: '0 4px' }}>
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text)', marginBottom: '4px', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={product.productName}>{product.productName}</h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '6px' }}>{categoryLabel}</div>
          <strong className="price" style={{ fontSize: '1.05rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text)' }}>{money(product.price)}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-olive)', fontWeight: 500 }}>
            {product.availability > 0 ? t('product.in_stock') : t('product.out_of_stock')}
          </span>
          <button
            id={`add-to-cart-${product.id}`}
            className="btn btn-primary btn-sm"
            onClick={handleAdd}
            disabled={product.availability === 0}
            style={{ borderRadius: '9999px', padding: '6px 16px' }}
          >
            {t('product.add_to_cart')}
          </button>
        </div>
      </div>
    </article>
  );
}

