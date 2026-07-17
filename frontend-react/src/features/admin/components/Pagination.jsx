import { useTranslation } from 'react-i18next';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) pages.push('...');
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push('...');
      
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="admin-pagination">
      <button
        className="admin-pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &larr; {t('common.previous')}
      </button>

      <div className="admin-pagination-pages">
        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span key={`dots-${index}`} className="admin-pagination-dots">...</span>
          ) : (
            <button
              key={page}
              className={`admin-pagination-page-btn ${page === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        className="admin-pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {t('common.next')} &rarr;
      </button>
    </div>
  );
}
