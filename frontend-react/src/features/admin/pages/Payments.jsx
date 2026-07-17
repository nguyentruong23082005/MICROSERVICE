import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllPayments } from '../../payment/index.js';
import { formatDate, money } from '../../../utils/formatters.js';
import { translateStatus } from '../../../utils/uiText.js';
import { CreditCard } from '../../../components/icons/index.js';
import Pagination from '../components/Pagination.jsx';
import AdminModal from '../components/AdminModal.jsx';
import { paginateItems } from '../utils/paginateItems.js';
import { ADMIN_PAGE_SIZE } from '../../../utils/constants.js';

const COMPLETED_PAYMENT_STATUSES = new Set(['COMPLETED', 'PAYMENT_COMPLETED', 'SUCCESS']);

function paymentAmount(payment = {}) {
  return Number(payment.amount ?? payment.paymentAmount ?? 0);
}

function isCompletedPayment(payment = {}) {
  return COMPLETED_PAYMENT_STATUSES.has(String(payment.status || '').toUpperCase());
}

export default function Payments() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const load = () => {
    setLoading(true);
    getAllPayments()
      .then(d => setPayments(Array.isArray(d) ? d : []))
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

  const totalAmount = payments.reduce((acc, p) => acc + paymentAmount(p), 0);
  const successCount = payments.filter(isCompletedPayment).length;

  return (
    <div className="admin-page-shell">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">{t('admin.payments.title')}</h1>
          <p className="admin-subtitle">{t('admin.payments.description')}</p>
        </div>
      </div>

      {error && <div className="admin-notice admin-notice-error">{error}</div>}

      <div className="admin-stats">
        <div className="metric-card highlight">
          <span className="metric-label">{t('admin.payments.total_revenue')}</span>
          <span className="metric-value">{loading ? '…' : money(totalAmount)}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">{t('admin.payments.total_transactions')}</span>
          <span className="metric-value">{loading ? '…' : payments.length}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">{t('admin.payments.successful')}</span>
          <span className="metric-value">{loading ? '…' : successCount}</span>
        </div>
      </div>

      <AdminModal
        isOpen={Boolean(selectedPayment)}
        title={selectedPayment ? `Giao dịch #${selectedPayment.id || selectedPayment.paymentId}` : 'Chi tiết giao dịch'}
        subtitle="Đối soát đơn hàng, trạng thái gateway và thời điểm thanh toán."
        size="md"
        onClose={() => setSelectedPayment(null)}
        footer={<button type="button" className="admin-btn admin-btn-outline" onClick={() => setSelectedPayment(null)}>Đóng</button>}
      >
        {selectedPayment && (
          <div className="admin-detail-grid">
            <div className="admin-detail-item">
              <span className="admin-detail-label">Mã giao dịch</span>
              <p className="admin-detail-value">#{selectedPayment.id || selectedPayment.paymentId}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Đơn hàng</span>
              <p className="admin-detail-value">#{selectedPayment.orderId || '-'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Khách hàng</span>
              <p className="admin-detail-value">#{selectedPayment.userId || selectedPayment.customerId || '-'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Trạng thái</span>
              <p className="admin-detail-value">{translateStatus(selectedPayment.status)}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Số tiền</span>
              <p className="admin-detail-value">{money(paymentAmount(selectedPayment))}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Ngày thanh toán</span>
              <p className="admin-detail-value">{selectedPayment.paidAt ? formatDate(selectedPayment.paidAt) : '-'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Phương thức</span>
              <p className="admin-detail-value">{selectedPayment.method || selectedPayment.paymentMethod || selectedPayment.gateway || '-'}</p>
            </div>
            <div className="admin-detail-item">
              <span className="admin-detail-label">Mã tham chiếu</span>
              <p className="admin-detail-value">{selectedPayment.referenceCode || selectedPayment.transactionNo || selectedPayment.txnRef || '-'}</p>
            </div>
          </div>
        )}
      </AdminModal>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.payments.transaction_id')}</th>
              <th>{t('admin.payments.order_id')}</th>
              <th>{t('admin.payments.customer_id')}</th>
              <th>{t('admin.payments.status')}</th>
              <th>{t('admin.payments.amount')}</th>
              <th>{t('admin.payments.payment_date')}</th>
              <th className="admin-table-actions-head">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginateItems(payments, currentPage, ADMIN_PAGE_SIZE).items.map(p => (
              <tr key={p.id || p.paymentId}>
                <td className="admin-table-number">{p.id || p.paymentId}</td>
                <td>#{p.orderId}</td>
                <td>#{p.userId}</td>
                <td>
                  <span className={`admin-badge ${(p.status || '').toLowerCase()}`}>
                    {translateStatus(p.status)}
                  </span>
                </td>
                <td className="admin-table-number">{money(paymentAmount(p))}</td>
                <td>{p.paidAt ? formatDate(p.paidAt) : '-'}</td>
                <td className="admin-table-actions-cell">
                  <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => setSelectedPayment(p)}>Chi tiết</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={paginateItems(payments, currentPage, ADMIN_PAGE_SIZE).totalPages}
          onPageChange={setCurrentPage}
        />
        {payments.length === 0 && !loading && (
          <div className="admin-empty">
            <CreditCard className="admin-empty-icon" size={48} />
            <h3>{t('admin.payments.empty_title')}</h3>
            <p>{t('admin.payments.empty_description')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
