import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { createReview, getProductReviews } from '../services/reviewService.js';

function Stars({ rating }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span style={{ color: '#A47551', letterSpacing: '1px' }} aria-label={`${value} sao`}>
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  );
}

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState({
    rating: 5,
    title: '',
    comment: '',
  });

  useEffect(() => {
    if (!productId) return;
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoading(true);
        setError('');
        return getProductReviews(productId);
      })
      .then((data) => {
        if (active && data) setReviews(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Không thể tải đánh giá sản phẩm.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [productId, reloadKey]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?.userId) {
      setSubmitError('Vui lòng đăng nhập để viết đánh giá.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      await createReview(user.userId, productId, {
        rating: Number(form.rating),
        title: form.title,
        comment: form.comment,
      });
      setForm({ rating: 5, title: '', comment: '' });
      setReloadKey((value) => value + 1);
    } catch (err) {
      setSubmitError(err.message || 'Không thể gửi đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '48px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '48px', alignItems: 'start' }}>
        {/* Left Column: Reviews List / Empty State */}
        <div>
          <div style={{ marginBottom: '24px' }}>
            <p className="eyebrow" style={{ fontSize: '0.75rem', color: 'var(--color-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Đánh giá sản phẩm</p>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 400, fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
              {reviews.length > 0 ? `${averageRating}/5 từ ${reviews.length} đánh giá` : 'Chưa có đánh giá'}
            </h2>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {loading && <p className="muted">Đang tải đánh giá...</p>}
            {error && <p role="alert" style={{ color: '#B85042' }}>{error}</p>}
            {!loading && !error && reviews.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: '#fafaf9', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '20px' }}>
                  {/* Floor Lamp */}
                  <path d="M130 110 C120 70, 95 40, 70 40 C60 40, 55 48, 55 56" stroke="#7d8778" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
                  <path d="M130 110 L130 130" stroke="var(--color-text)" strokeWidth="2" />
                  <ellipse cx="130" cy="130" rx="12" ry="2.5" fill="#e2e2de" stroke="var(--color-text)" strokeWidth="1.5" />
                  {/* Lamp Head */}
                  <path d="M45 56 L65 56 L60 48 L50 48 Z" fill="#7d8778" stroke="var(--color-text)" strokeWidth="1.5" />
                  <line x1="55" y1="56" x2="55" y2="64" stroke="var(--color-text)" strokeWidth="1.5" />
                  {/* Lamp Light Glow */}
                  <polygon points="35 100 75 100 55 64" fill="#fefef2" opacity="0.6" />

                  {/* Chair */}
                  {/* Chair Legs */}
                  <line x1="75" y1="105" x2="68" y2="128" stroke="var(--color-text)" strokeWidth="1.8" />
                  <line x1="95" y1="105" x2="102" y2="128" stroke="var(--color-text)" strokeWidth="1.8" />
                  <line x1="80" y1="105" x2="82" y2="124" stroke="var(--color-text)" strokeWidth="1.2" opacity="0.7" />
                  <line x1="90" y1="105" x2="88" y2="124" stroke="var(--color-text)" strokeWidth="1.2" opacity="0.7" />
                  {/* Chair Body */}
                  <path d="M64 85 C64 73, 106 73, 106 85 C106 95, 100 105, 85 105 C70 105, 64 95, 64 85 Z" fill="#f5f5f0" stroke="var(--color-text)" strokeWidth="1.5" />
                  {/* Cushion */}
                  <path d="M68 97 C68 97, 85 101, 102 97 C100 103, 70 103, 68 97 Z" fill="#e2e2de" stroke="var(--color-text)" strokeWidth="1.5" />

                  {/* Plant Stand & Pot */}
                  <line x1="155" y1="102" x2="155" y2="128" stroke="var(--color-text)" strokeWidth="1.5" />
                  <line x1="147" y1="128" x2="163" y2="128" stroke="var(--color-text)" strokeWidth="1.5" />
                  {/* Stand Shelf */}
                  <ellipse cx="155" cy="102" rx="8" ry="1.8" fill="#e2e2de" stroke="var(--color-text)" strokeWidth="1.5" />
                  {/* Flower Pot */}
                  <path d="M151 102 L159 102 L157 92 L153 92 Z" fill="#cfcfc8" stroke="var(--color-text)" strokeWidth="1.5" />
                  {/* Plant leaves */}
                  <path d="M155 92 Q160 76 164 78" stroke="var(--color-text)" strokeWidth="1.5" fill="none" />
                  <path d="M155 92 Q150 72 145 74" stroke="var(--color-text)" strokeWidth="1.5" fill="none" />
                  <path d="M155 92 Q155 68 157 68" stroke="var(--color-text)" strokeWidth="1.5" fill="none" />
                  <circle cx="164" cy="78" r="1.5" fill="#7d8778" />
                  <circle cx="145" cy="74" r="1.5" fill="#7d8778" />
                  <circle cx="157" cy="68" r="1.5" fill="#7d8778" />
                </svg>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', textAlign: 'center', maxWidth: '280px', lineHeight: 1.6 }}>
                  Hãy là người đầu tiên chia sẻ trải nghiệm với sản phẩm này.
                </p>
              </div>
            )}
            {reviews.map((review) => (
              <article key={review.id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '18px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                  <div>
                    <strong>{review.user?.userName || 'Khách hàng'}</strong>
                    {review.title && <div style={{ fontWeight: 500, marginTop: '4px' }}>{review.title}</div>}
                  </div>
                  <Stars rating={review.rating} />
                </div>
                {review.comment && <p className="muted" style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>{review.comment}</p>}
              </article>
            ))}
          </div>
        </div>

        {/* Right Column: Write Review Form */}
        <div>
          <form onSubmit={handleSubmit} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '28px', background: 'white' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 500, color: 'var(--color-text)' }}>Viết đánh giá</h3>
            
            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="review-rating" style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '8px', color: 'var(--color-text)' }}>Điểm đánh giá</label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 14px', background: 'white' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setForm({ ...form, rating: star })}
                      style={{
                        fontSize: '1.4rem',
                        color: star <= form.rating ? '#A47551' : '#e2e2de',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <select
                  id="review-rating"
                  name="rating"
                  value={form.rating}
                  onChange={handleChange}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'var(--color-text)'
                  }}
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>{rating} sao</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <label htmlFor="review-title" style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '8px', color: 'var(--color-text)' }}>Tiêu đề</label>
              <input
                id="review-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={160}
                placeholder="Ấn tượng chính của bạn"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label htmlFor="review-comment" style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '8px', color: 'var(--color-text)' }}>Nhận xét</label>
              <textarea
                id="review-comment"
                name="comment"
                value={form.comment}
                onChange={handleChange}
                rows={4}
                maxLength={2000}
                placeholder="Chia sẻ thêm về chất liệu, màu sắc, trải nghiệm sử dụng"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  lineHeight: 1.6
                }}
              />
            </div>

            {submitError && <p role="alert" style={{ color: '#B85042', marginBottom: '16px', fontSize: '0.88rem' }}>{submitError}</p>}
            
            <button
              className="btn btn-primary btn-full"
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                height: '48px',
                background: 'var(--color-text)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
