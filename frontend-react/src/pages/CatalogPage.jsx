import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../features/products/components/ProductCard.jsx';
import { getCategories, getProductPage } from '../features/products/services/productService.js';
import Pagination from '../features/admin/components/Pagination.jsx';
import { MagnifierIcon } from '../components/icons/index.js';

const PAGE_SIZE = 12;

function readPositivePage(value) {
  const page = Number.parseInt(value || '1', 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftSearch, setDraftSearch] = useState(searchParams.get('q') || '');
  const [draftMinPrice, setDraftMinPrice] = useState(searchParams.get('minPrice') || '');
  const [draftMaxPrice, setDraftMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [categories, setCategories] = useState([]);
  const [pageData, setPageData] = useState({ items: [], page: 1, totalItems: 0, totalPages: 0 });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const page = readPositivePage(searchParams.get('page'));
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? [...data] : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    const request = Promise.resolve().then(() => {
      if (!active) return null;
      setStatus('loading');
      setError('');
      return getProductPage({ page, size: PAGE_SIZE, name: query, category, minPrice, maxPrice });
    });

    request
      .then((data) => {
        if (!active) return;
        setPageData(data);
        setStatus('ready');
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || 'Không thể tải danh mục sản phẩm.');
        setStatus('error');
      });

    return () => { active = false; };
  }, [page, query, category, minPrice, maxPrice]);

  const resultLabel = useMemo(() => {
    if (status !== 'ready') return 'Đang cập nhật bộ sưu tập';
    return `${pageData.totalItems} sản phẩm được tuyển chọn`;
  }, [pageData.totalItems, status]);

  const updateFilters = useCallback((updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') next.set(key, String(value));
      else next.delete(key);
    });
    if (!Object.hasOwn(updates, 'page')) next.delete('page');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const handleSubmit = (event) => {
    event.preventDefault();
    updateFilters({ q: draftSearch.trim() });
  };

  // Debounce minPrice and maxPrice updates
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentMin = searchParams.get('minPrice') || '';
      const currentMax = searchParams.get('maxPrice') || '';
      if (draftMinPrice !== currentMin || draftMaxPrice !== currentMax) {
        updateFilters({
          minPrice: draftMinPrice,
          maxPrice: draftMaxPrice,
          page: 1,
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [draftMinPrice, draftMaxPrice, searchParams, updateFilters]);

  // Sync state if URL changes directly (e.g. on reset)
  useEffect(() => {
    const task = window.setTimeout(() => {
      setDraftMinPrice(minPrice);
      setDraftMaxPrice(maxPrice);
    }, 0);
    return () => window.clearTimeout(task);
  }, [minPrice, maxPrice]);

  return (
    <main className="catalog-page">
      <div className="shell" style={{ marginBottom: '40px', marginTop: '32px' }}>
        <span className="eyebrow">Bộ sưu tập Furniq</span>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 300, fontFamily: 'var(--font-display)', marginTop: '8px' }}>Tất cả sản phẩm</h1>
      </div>

      <section className="catalog-section shell" aria-label="Danh mục sản phẩm">
        <div className="catalog-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', flex: 1 }}>
            <form className="catalog-search" onSubmit={handleSubmit} role="search" style={{ margin: 0, minWidth: '280px' }}>
              <MagnifierIcon size={18} strokeWidth={2} />
              <label className="sr-only" htmlFor="catalog-search-input">Tìm sản phẩm</label>
              <input
                id="catalog-search-input"
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Tìm theo tên sản phẩm"
              />
              <button type="submit">Tìm kiếm</button>
            </form>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label htmlFor="min-price-input" className="sr-only">Giá tối thiểu</label>
                <input
                  id="min-price-input"
                  type="number"
                  value={draftMinPrice}
                  onChange={(e) => setDraftMinPrice(e.target.value)}
                  placeholder="Giá từ"
                  style={{
                    padding: '10px 14px',
                    height: '52px',
                    boxSizing: 'border-box',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    width: '100px',
                    fontSize: '0.9rem',
                    background: 'white',
                    outline: 'none',
                  }}
                />
              </div>
              <span style={{ color: 'var(--color-muted)' }}>–</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label htmlFor="max-price-input" className="sr-only">Giá tối đa</label>
                <input
                  id="max-price-input"
                  type="number"
                  value={draftMaxPrice}
                  onChange={(e) => setDraftMaxPrice(e.target.value)}
                  placeholder="Đến"
                  style={{
                    padding: '10px 14px',
                    height: '52px',
                    boxSizing: 'border-box',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    width: '100px',
                    fontSize: '0.9rem',
                    background: 'white',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          <label className="catalog-select-label" htmlFor="catalog-category" style={{ margin: 0 }}>
            <span>Không gian</span>
            <select
              id="catalog-category"
              value={category}
              onChange={(event) => updateFilters({ category: event.target.value })}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((item) => (
                <option key={item.id || item.slug || item.name} value={item.slug || item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="catalog-results-head">
          <div>
            <span className="eyebrow">Danh mục</span>
            <h2>{query ? `Kết quả cho “${query}”` : 'Tất cả sản phẩm'}</h2>
          </div>
          <p aria-live="polite">{resultLabel}</p>
        </div>

        {status === 'loading' && (
          <div className="catalog-skeleton-grid" aria-label="Đang tải sản phẩm">
            {Array.from({ length: 8 }, (_, index) => <div className="catalog-skeleton" key={index} />)}
          </div>
        )}

        {status === 'error' && (
          <div className="catalog-state" role="alert">
            <span>Không thể mở bộ sưu tập</span>
            <h2>Đường truyền đang gián đoạn</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => updateFilters({ page })}>Thử lại</button>
          </div>
        )}

        {status === 'ready' && pageData.items.length === 0 && (
          <div className="catalog-state">
            <span>Chưa tìm thấy lựa chọn phù hợp</span>
            <h2>Hãy thử một từ khóa hoặc không gian khác</h2>
            <button className="btn btn-primary" onClick={() => { setDraftSearch(''); setDraftMinPrice(''); setDraftMaxPrice(''); setSearchParams({}); }}>
              Xem toàn bộ sản phẩm
            </button>
          </div>
        )}

        {status === 'ready' && pageData.items.length > 0 && (
          <>
            <div className="catalog-grid">
              {pageData.items.map((product) => <ProductCard product={product} key={product.id} />)}
            </div>
            <div className="catalog-pagination">
              <Pagination
                currentPage={pageData.page}
                totalPages={pageData.totalPages}
                onPageChange={(nextPage) => {
                  updateFilters({ page: nextPage });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
