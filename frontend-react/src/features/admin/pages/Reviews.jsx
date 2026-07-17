import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteReview, getReviews, updateReviewStatus } from '../../reviews/index.js';
import { translateStatus } from '../../../utils/uiText.js';
import Pagination from '../components/Pagination.jsx';
import { paginateItems } from '../utils/paginateItems.js';
import { ADMIN_PAGE_SIZE } from '../../../utils/constants.js';

function starText(rating = 0) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);
}

export default function Reviews() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const load = () => {
    setLoading(true);
    setError(null);
    getReviews('ALL')
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) load();
    });
    return () => { active = false; };
  }, []);

  const handleDelete = async (id) => {
    if (!confirm(t('admin.review_management.delete_confirm'))) return;
    try {
      await deleteReview(id);
      setMessage({ type: 'success', text: t('admin.review_management.delete_success') });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateReviewStatus(id, status);
      setMessage({ type: 'success', text: t('admin.review_management.status_success') });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, review) => acc + (review.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="admin-page-shell">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">{t('admin.review_management.title')}</h1>
          <p className="admin-subtitle">{t('admin.review_management.description')}</p>
        </div>
      </div>

      {message && (
        <div className={`admin-notice ${message.type === 'success' ? 'admin-notice-success' : 'admin-notice-error'}`}>
          {message.text}
        </div>
      )}

      {error && <div className="admin-notice admin-notice-error">{error}</div>}

      <div className="admin-stats">
        <div className="metric-card">
          <span className="metric-label">{t('admin.review_management.total')}</span>
          <span className="metric-value">{loading ? '...' : reviews.length}</span>
        </div>
        <div className="metric-card highlight">
          <span className="metric-label">{t('admin.review_management.average')}</span>
          <span className="metric-value">{loading ? '...' : `${avgRating} / 5`}</span>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{t('admin.review_management.product')}</th>
              <th>{t('admin.review_management.customer')}</th>
              <th>{t('admin.review_management.rating')}</th>
              <th>{t('admin.review_management.content')}</th>
              <th>{t('admin.review_management.status')}</th>
              <th className="admin-table-actions-head">{t('admin.review_management.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginateItems(reviews, currentPage, ADMIN_PAGE_SIZE).items.map(review => (
              <tr key={review.id}>
                <td className="admin-table-number">{review.id}</td>
                <td>
                  <div className="admin-table-primary">
                    {review.product?.productName || t('admin.review_management.deleted_product')}
                  </div>
                  <div className="admin-table-secondary">
                    {t('admin.review_management.product_id', { id: review.product?.id || '-' })}
                  </div>
                </td>
                <td>{review.user?.userName || t('admin.review_management.customer_fallback')}</td>
                <td>
                  <span className="admin-review-stars" aria-label={t('admin.review_management.stars', { count: review.rating || 0 })}>
                    {starText(review.rating)}
                  </span>
                  <span className="admin-review-rating-copy">
                    ({t('admin.review_management.stars', { count: review.rating || 0 })})
                  </span>
                </td>
                <td>
                  <div className="admin-table-primary">{review.title || t('admin.review_management.no_title')}</div>
                  <div className="admin-table-secondary admin-table-secondary--truncate">
                    {review.comment || t('admin.review_management.no_comment')}
                  </div>
                </td>
                <td>
                  <span className={`admin-badge ${(review.status || 'APPROVED').toLowerCase()}`}>{translateStatus(review.status || 'APPROVED')}</span>
                </td>
                <td className="admin-table-actions-cell">
                  <div className="admin-action-group">
                    <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => handleStatus(review.id, (review.status || 'APPROVED') === 'HIDDEN' ? 'APPROVED' : 'HIDDEN')}>
                      {(review.status || 'APPROVED') === 'HIDDEN' ? t('admin.review_management.show') : t('admin.review_management.hide')}
                    </button>
                    <button className="admin-btn admin-btn-danger admin-btn--small" onClick={() => handleDelete(review.id)}>
                      {t('common.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={paginateItems(reviews, currentPage, ADMIN_PAGE_SIZE).totalPages}
          onPageChange={setCurrentPage}
        />
        {reviews.length === 0 && !loading && (
          <div className="admin-empty">
            <h3>{t('admin.review_management.empty_title')}</h3>
            <p>{t('admin.review_management.empty_description')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
