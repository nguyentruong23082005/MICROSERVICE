import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAllProducts, getCategories } from '../features/products/services/productService.js';
import ProductCard from '../features/products/components/ProductCard.jsx';
import { ROOM_CATEGORIES } from '../utils/uiText.js';
import heroImg from '../assets/hero.png';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCategoryPage, setCurrentCategoryPage] = useState(0);
  const [currentProductPage, setCurrentProductPage] = useState(0);

  const loadProducts = () => {
    setLoading(true);
    setError(null);
    getAllProducts()
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadProducts();
      getCategories()
        .then(data => {
          if (active) setCategories(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          if (active) setCategories([]);
        });
    });
    return () => { active = false; };
  }, []);

  const categoryCards = useMemo(() => {
    if (categories.length === 0) {
      return ROOM_CATEGORIES.map(category => ({
        ...category,
        slug: null,
        count: 0,
      }));
    }
    return categories
      .map(category => {
        const slugLower = category.slug?.toLowerCase();
        const count = products.filter(p => 
          (p.categoryRef?.slug && p.categoryRef.slug.toLowerCase() === slugLower) ||
          (p.category && p.category.toLowerCase() === slugLower)
        ).length;
        return {
          value: category.slug,
          label: category.name,
          slug: category.slug,
          imageUrl: category.imageUrl,
          count,
        };
      })
      .filter(cat => products.length === 0 || cat.count > 0);
  }, [categories, products]);

  const categoriesPerPage = 6;
  const totalCategoryPages = Math.ceil(categoryCards.length / categoriesPerPage);
  const displayedCategories = categoryCards.slice(currentCategoryPage * categoriesPerPage, (currentCategoryPage + 1) * categoriesPerPage);

  const productsPerPage = 8;
  const totalProductPages = Math.ceil(products.length / productsPerPage);
  const displayedProducts = products.slice(currentProductPage * productsPerPage, (currentProductPage + 1) * productsPerPage);

  const handlePrevCategory = () => {
    setCurrentCategoryPage((prev) => (prev > 0 ? prev - 1 : totalCategoryPages - 1));
  };
  const handleNextCategory = () => {
    setCurrentCategoryPage((prev) => (prev < totalCategoryPages - 1 ? prev + 1 : 0));
  };

  const handlePrevProduct = () => {
    setCurrentProductPage((prev) => (prev > 0 ? prev - 1 : totalProductPages - 1));
  };
  const handleNextProduct = () => {
    setCurrentProductPage((prev) => (prev < totalProductPages - 1 ? prev + 1 : 0));
  };

  const getProductCount = (catCard) => {
    if (!catCard || !catCard.slug) return '0 sản phẩm';
    return `${catCard.count || 0} sản phẩm`;
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      
      {/* Hero Section */}
      <section className="shell section-padding">
        <div className="grid-2 items-center" style={{ gap: '48px' }}>
          <div>
            <p className="eyebrow" style={{ letterSpacing: '0.08em', fontWeight: 600, fontSize: '0.8rem', color: '#8c7853', marginBottom: '16px', textTransform: 'uppercase' }}>
              Japandi Collection
            </p>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '24px', fontFamily: 'var(--font-display)' }}>
              {t('home.hero_title')}
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-muted)', marginBottom: '32px', maxWidth: '480px', lineHeight: '1.6' }}>
              {t('home.hero_description')}
            </p>
            <div className="flex gap-sm" style={{ marginBottom: '40px' }}>
              <button 
                className="btn" 
                style={{ 
                  background: '#1e2c31', 
                  color: 'white', 
                  borderRadius: 'var(--radius-pill)', 
                  padding: '12px 32px',
                  fontWeight: 500,
                  transition: 'background-color 0.2s',
                  cursor: 'pointer'
                }} 
                onClick={() => document.getElementById('featured').scrollIntoView({ behavior: 'smooth' })}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2c3f46'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#1e2c31'}
              >
                Mua sắm ngay
              </button>
              <button 
                className="btn btn-outline" 
                style={{ 
                  borderRadius: 'var(--radius-pill)', 
                  padding: '12px 32px',
                  fontWeight: 500
                }}
                onClick={() => navigate('/collections')}
              >
                {t('home.view_collections')}
              </button>
            </div>
            
            {/* Core Badges Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px', color: 'var(--color-text-muted)', fontSize: '0.85rem', borderTop: '1px solid var(--color-border)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-house-heart" style={{ fontSize: '1.1rem', color: '#8c7853' }}></i>
                <span>Hơn 120+ sản phẩm cao cấp</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-truck" style={{ fontSize: '1.1rem', color: '#8c7853' }}></i>
                <span>Miễn phí giao hàng toàn quốc</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-shield-check" style={{ fontSize: '1.1rem', color: '#8c7853' }}></i>
                <span>Bảo hành dài hạn</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-arrow-counterclockwise" style={{ fontSize: '1.1rem', color: '#8c7853' }}></i>
                <span>Đổi trả 30 ngày dễ dàng</span>
              </div>
            </div>
          </div>
          
          {/* Hero Image & Floating Card */}
          <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '24px', overflow: 'hidden' }}>
            <img src={heroImg} alt={t('home.hero_alt')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            
            {/* Floating Overlay Card */}
            <div style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              right: '24px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              padding: '12px 16px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              zIndex: 5,
            }}
            onClick={() => navigate('/collections')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', background: '#eee' }}>
                  <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=100&q=80" alt="SCHO Collection" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>SCHO Collection</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>Minimalist Japanese-Scandinavian Design</div>
                </div>
              </div>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--color-border)', display: 'grid', placeItems: 'center', background: 'white' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories / Shop by Space */}
      <section className="shell section-padding" style={{ paddingTop: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 400 }}>Mua theo không gian</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span onClick={() => navigate('/catalog')} style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)', cursor: 'pointer' }}>
              Xem tất cả →
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handlePrevCategory} 
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--color-border)', background: 'white', display: 'grid', placeItems: 'center', cursor: 'pointer', outline: 'none' }}
                aria-label="Previous Page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={handleNextCategory} 
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--color-border)', background: 'white', display: 'grid', placeItems: 'center', cursor: 'pointer', outline: 'none' }}
                aria-label="Next Page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="grid-6">
          {displayedCategories.map((cat) => (
            <div
              key={cat.value}
              onClick={() => cat.slug && navigate(`/san-pham/${cat.slug}`)}
              style={{
                background: '#FAF8F5',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                height: '320px',
                justifyContent: 'space-between',
                cursor: cat.slug ? 'pointer' : 'default',
                border: '1px solid var(--color-border)',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (cat.slug) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (cat.slug) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '60px' }}>
                <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text)', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cat.label}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '4px' }}>{getProductCount(cat)}</span>
              </div>
              <div style={{ height: '200px', borderRadius: '12px', overflow: 'hidden', background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.label} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--color-muted)', fontSize: '0.85rem' }}>Không có ảnh</div>
                )}
              </div>
              
              {/* Floating Arrow button */}
              {cat.slug && (
                <div style={{
                  position: 'absolute',
                  bottom: '24px',
                  right: '24px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'white',
                  border: '1px solid var(--color-border)',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  zIndex: 2,
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>→</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Category Dots Indicator */}
        {totalCategoryPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
            {Array.from({ length: totalCategoryPages }).map((_, idx) => (
              <span 
                key={idx}
                onClick={() => setCurrentCategoryPage(idx)}
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: currentCategoryPage === idx ? 'var(--color-text)' : 'var(--color-border)', 
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              ></span>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section id="featured" className="shell section-padding" style={{ paddingTop: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 400 }}>Sản phẩm nổi bật</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span onClick={() => navigate('/catalog')} style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)', cursor: 'pointer' }}>
              Xem tất cả →
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handlePrevProduct} 
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--color-border)', background: 'white', display: 'grid', placeItems: 'center', cursor: 'pointer', outline: 'none' }}
                aria-label="Previous Page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={handleNextProduct} 
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--color-border)', background: 'white', display: 'grid', placeItems: 'center', cursor: 'pointer', outline: 'none' }}
                aria-label="Next Page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="loading-spinner" aria-label={t('home.loading_products')} />}

        {error && (
          <div className="empty-state">
             <p>{t('home.load_error', { message: error })}</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className="grid-4">
              {displayedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            
            {/* Dots Indicator */}
            {totalProductPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                {Array.from({ length: Math.min(8, totalProductPages) }).map((_, idx) => (
                  <span 
                    key={idx}
                    onClick={() => setCurrentProductPage(idx)}
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: currentProductPage === idx ? 'var(--color-text)' : 'var(--color-border)', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  ></span>
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="empty-state">
            <h2 style={{ marginBottom: '16px' }}>{t('home.empty_products')}</h2>
          </div>
        )}
      </section>

      {/* Benefits */}
      <section className="shell" style={{ marginBottom: '64px' }}>
        <div className="grid-4" style={{
          background: '#FAF8F5',
          borderRadius: '16px',
          padding: '32px',
          gap: '32px',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <i className="bi bi-flower1" style={{ fontSize: '2rem', color: '#8c7853' }}></i>
            <div>
              <h3 style={{ marginBottom: '6px', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)' }}>Chất liệu bền vững</h3>
              <p className="muted" style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: 0, color: 'var(--color-text-muted)' }}>Gỗ tự nhiên và vật liệu thân thiện với môi trường.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <i className="bi bi-truck" style={{ fontSize: '2rem', color: '#8c7853' }}></i>
            <div>
              <h3 style={{ marginBottom: '6px', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)' }}>Giao hàng tận tâm</h3>
              <p className="muted" style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: 0, color: 'var(--color-text-muted)' }}>Đóng gói kỹ lưỡng, giao hàng nhanh chóng.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <i className="bi bi-calendar3" style={{ fontSize: '2rem', color: '#8c7853' }}></i>
            <div>
              <h3 style={{ marginBottom: '6px', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)' }}>Đổi trả 30 ngày</h3>
              <p className="muted" style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: 0, color: 'var(--color-text-muted)' }}>Nếu sản phẩm chưa thật sự phù hợp, bạn có thể đổi trả trong 30 ngày.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <i className="bi bi-shield-check" style={{ fontSize: '2rem', color: '#8c7853' }}></i>
            <div>
              <h3 style={{ marginBottom: '6px', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)' }}>Bảo hành dài hạn</h3>
              <p className="muted" style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: 0, color: 'var(--color-text-muted)' }}>Sản phẩm được bảo hành lên đến 36 tháng.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

