import { useEffect, useState } from 'react';
import { useRecommendations } from '../hooks/useRecommendations.js';
import { useAuth } from '../../auth/hooks/useAuth.js';

export default function RecommendationList({ product }) {
  const { user } = useAuth();
  const {
    recommendations,
    loading,
    error,
    fetchRecommendations,
    addRecommendation,
  } = useRecommendations();

  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (product?.productName) {
      let active = true;
      Promise.resolve().then(() => {
        if (active) fetchRecommendations(product.productName);
      });
      return () => { active = false; };
    }
  }, [product?.productName, fetchRecommendations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setNotice({ type: 'error', text: 'Vui lòng đăng nhập để đánh giá sản phẩm' });
      return;
    }
    setSubmitting(true);
    setNotice(null);
    try {
      await addRecommendation(user.userId, product.id, rating, product.productName);
      setNotice({ type: 'success', text: '✓ Cảm ơn bạn đã gửi đánh giá!' });
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Lỗi khi gửi đánh giá' });
    } finally {
      setSubmitting(false);
    }
  };

  // Tính trung bình rating
  const avgRating = recommendations.length > 0
    ? (recommendations.reduce((acc, r) => acc + (r.rating || 0), 0) / recommendations.length).toFixed(1)
    : null;

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <p className="eyebrow">Đánh giá khách hàng</p>
      <div className="flex justify-between items-center mb-2">
        <h2>Nhận xét &amp; Đánh giá ({recommendations.length})</h2>
        {avgRating && (
          <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
            ⭐ {avgRating} / 5
          </strong>
        )}
      </div>

      {loading && <div className="loading-spinner" />}
      {error && <div className="toast toast-error" style={{ position: 'static', marginBottom: 16 }}>{error}</div>}

      {/* Review List */}
      <div className="admin-list" style={{ maxHeight: 250, overflowY: 'auto', marginBottom: 20 }}>
        {recommendations.map((r) => (
          <div key={r.id} className="admin-row" style={{ alignItems: 'flex-start', padding: '12px 0' }}>
            <div style={{ flex: 1 }}>
              <div className="flex justify-between">
                <strong>{r.user?.userName || 'Khách hàng'}</strong>
                <span style={{ color: '#d4af37' }}>{'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}</span>
              </div>
              <span className="admin-row-meta" style={{ fontSize: '.8rem' }}>Đã đánh giá sản phẩm này</span>
            </div>
          </div>
        ))}
        {recommendations.length === 0 && !loading && (
          <div className="admin-empty-state" style={{ minHeight: 80 }}>
            Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên!
          </div>
        )}
      </div>

      {/* Add Review Form */}
      {user ? (
        <form onSubmit={handleSubmit} style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
          <h3 style={{ marginBottom: 12 }}>Gửi đánh giá của bạn</h3>
          {notice && (
            <div className={`admin-notice ${notice.type === 'success' ? 'admin-notice-success' : 'admin-notice-error'}`} style={{ marginBottom: 12 }}>
              {notice.text}
            </div>
          )}
          <div className="flex items-center gap-sm mb-2">
            <label style={{ fontSize: '.85rem', fontWeight: 800 }}>Số sao (Rating):</label>
            <select
              className="input-field"
              style={{ width: 'auto', padding: '4px 12px' }}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map(n => (
                <option key={n} value={n}>{n} ★</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      ) : (
        <div className="admin-callout" style={{ fontSize: '.85rem' }}>
          Bạn cần đăng nhập để gửi đánh giá cho thức uống này.
        </div>
      )}
    </div>
  );
}
