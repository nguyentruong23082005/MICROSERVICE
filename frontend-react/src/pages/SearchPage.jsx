import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from '../features/products/components/ProductCard.jsx';
import { searchProducts } from '../features/products/services/productService.js';

/**
 * SearchPage — debounced live search against product-catalog-service.
 * Route: /search?q=<query>
 *
 * - Reads ?q= from URL so results are shareable/bookmarkable
 * - Debounce 400ms prevents request storm while typing
 * - Cancels stale requests via AbortController pattern (active flag)
 */
export default function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(!!initialQuery);

  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    let active = true;
    try {
      const data = await searchProducts(q.trim());
      if (!active) return;
      const list = Array.isArray(data) ? data : (data?.content || data?.products || []);
      setResults(list);
    } catch (err) {
      if (!active) return;
      setError(err.message || t('common.error'));
      setResults([]);
    } finally {
      if (active) setLoading(false);
    }

    return () => { active = false; };
  }, [t]);

  // Sync input → URL → search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchParams(query.trim() ? { q: query.trim() } : {}, { replace: true });
      doSearch(query);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch, setSearchParams]);

  return (
    <div className="shell section-padding">
      {/* Back button */}
      <button className="btn btn-ghost" style={{ marginBottom: '24px' }} onClick={() => navigate(-1)}>
        ← {t('common.back')}
      </button>

      {/* Search input */}
      <div style={{ maxWidth: '640px', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
          fontWeight: 300,
          fontFamily: 'var(--font-display)',
          marginBottom: '24px',
        }}>
          {t('search.title')}
        </h1>

        <div style={{ position: 'relative' }}>
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            autoFocus
            style={{
              width: '100%',
              padding: '16px 20px',
              paddingRight: '48px',
              borderRadius: '12px',
              border: '2px solid var(--color-border)',
              fontSize: '1.05rem',
              background: 'var(--color-surface)',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
          {loading && (
            <div style={{
              position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
              width: '18px', height: '18px', borderRadius: '50%',
              border: '2px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              animation: 'spin 0.6s linear infinite',
            }} />
          )}
        </div>
      </div>

      {/* Results count */}
      {searched && !loading && !error && (
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
          {results.length > 0
            ? `${results.length} ${t('search.results_for')} "${query}"`
            : `${t('search.no_results')} "${query}"`}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="empty-state">
          <p style={{ color: '#c0392b' }}>{error}</p>
        </div>
      )}

      {/* Results grid */}
      {!loading && !error && results.length > 0 && (
        <div className="grid-4">
          {results.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {searched && !loading && !error && results.length === 0 && (
        <div className="empty-state" style={{ paddingTop: '60px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
            {t('search.no_results')} &ldquo;{query}&rdquo;
          </h2>
          <p className="muted">{t('product.no_products')}</p>
        </div>
      )}

      {/* Prompt before searching */}
      {!searched && (
        <div className="empty-state" style={{ paddingTop: '60px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛋️</div>
          <p className="muted">{t('search.placeholder')}</p>
        </div>
      )}

      {/* spin keyframe (local) */}
      <style>{`
        @keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }
      `}</style>
    </div>
  );
}
