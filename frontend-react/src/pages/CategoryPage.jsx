import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from '../features/products/components/ProductCard.jsx';
import { getCategoryBySlug, getProductsByCategorySlug } from '../features/products/services/productService.js';

export default function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [resource, setResource] = useState({
    slug: null,
    category: null,
    products: [],
    error: null,
  });

  useEffect(() => {
    let active = true;

    Promise.all([
      getCategoryBySlug(slug).catch(() => null),
      getProductsByCategorySlug(slug).catch((err) => {
        if (err?.status === 404) return [];
        throw err;
      }),
    ])
      .then(([categoryData, productData]) => {
        if (!active) return;
        setResource({
          slug,
          category: categoryData,
          products: Array.isArray(productData) ? productData : [],
          error: null,
        });
      })
      .catch((err) => {
        if (!active) return;
        setResource({
          slug,
          category: null,
          products: [],
          error: err.message,
        });
      });

    return () => { active = false; };
  }, [slug]);

  const isCurrentResource = resource.slug === slug;
  const category = isCurrentResource ? resource.category : null;
  const products = isCurrentResource ? resource.products : [];
  const error = isCurrentResource ? resource.error : null;
  const loading = !isCurrentResource;

  const title = category?.name || t('category.default_title');
  const description = category?.description || t('category.default_description');

  return (
    <div className="shell section-padding">
      <button className="btn btn-ghost" style={{ marginBottom: '24px' }} onClick={() => navigate('/')}>
        {t('error.go_home')}
      </button>

      <div style={{ marginBottom: '36px', maxWidth: '760px' }}>
        <p className="eyebrow">{t('category.title')}</p>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)', marginBottom: '16px', fontWeight: 300, fontFamily: 'var(--font-display)' }}>{title}</h1>
        <p className="muted" style={{ fontSize: '1rem', lineHeight: 1.7 }}>{description}</p>
      </div>

      {loading && <div className="loading-spinner" aria-label={t('category.loading')} />}
      {error && <div className="empty-state"><p>{t('category.load_error', { message: error })}</p></div>}

      {!loading && !error && products.length > 0 && (
        <div className="grid-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="empty-state">
          <h2 style={{ marginBottom: '16px' }}>{t('category.empty')}</h2>
          <p className="muted">{t('category.empty_hint')}</p>
        </div>
      )}
    </div>
  );
}
