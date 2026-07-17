import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminGetOrders, adminUpdateOrderStatus } from '../services/adminService.js';
import { money } from '../../../utils/formatters.js';
import { translateStatus, translatePayment } from '../../../utils/uiText.js';
import {
  orderCustomerEmail,
  orderCustomerName,
  orderDateLabel,
  orderDisplayId,
  orderItemsCount,
  orderPaymentMethod,
  orderStatus,
  orderTotal,
} from '../../orders/utils/orderViewModel.js';

import Pagination from '../components/Pagination.jsx';
import AdminModal from '../components/AdminModal.jsx';
import { ADMIN_PAGE_SIZE } from '../../../utils/constants.js';
import { MagnifierIcon } from '../../../components/icons/index.js';

function orderItemImage(item) {
  const p = item?.product || item || {};
  return p.imageUrl || p.productImageUrl || p.thumbnailUrl || p.productImage || p.image || item?.productImageUrl || item?.imageUrl || '';
}

function orderItemName(item, index) {
  const p = item?.product || item || {};
  return p.productName || p.name || item?.productName || item?.name || `Sản phẩm #${item?.productId || p.productId || index + 1}`;
}

export default function Orders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [counts, setCounts] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (currentPage !== 1) {
      Promise.resolve().then(() => {
        setCurrentPage(1);
      });
    }
  }, [debouncedSearch, filterStatus, currentPage]);

  const loadCounts = () => {
    adminGetOrders()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const nextCounts = list.reduce(
          (acc, order) => {
            const status = orderStatus(order);
            return {
              ...acc,
              [status]: (acc[status] || 0) + 1,
            };
          },
          {},
        );
        setCounts(nextCounts);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const load = (page, searchVal, statusVal) => {
    setLoading(true);
    adminGetOrders(page - 1, ADMIN_PAGE_SIZE, {
      status: statusVal,
      search: searchVal,
    })
      .then((data) => {
        if (data && data.content) {
          setOrders(data.content);
          setTotalPages(data.totalPages || 0);
        } else {
          setOrders(Array.isArray(data) ? data : []);
          setTotalPages(0);
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    if (active) {
      Promise.resolve().then(() => {
        if (active) {
          load(currentPage, debouncedSearch, filterStatus);
        }
      });
    }
    return () => { active = false; };
  }, [currentPage, debouncedSearch, filterStatus]);

  const filtered = orders;

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await adminUpdateOrderStatus(orderId, newStatus);
      load(currentPage, debouncedSearch, filterStatus);
      loadCounts();
    } catch (err) {
      alert(t('admin.order_management.update_error', { message: err.message }));
    }
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">{t('admin.order_management.title')}</h1>
          <p className="admin-subtitle">{t('admin.order_management.description')}</p>
        </div>
      </div>

      {error && <div className="admin-notice admin-notice-error">{error}</div>}

      <div className="admin-stats">
        <div className="metric-card">
          <span className="metric-label">{t('admin.order_management.pending')}</span>
          <span className="metric-value">{counts.PAYMENT_EXPECTED || counts.Pending || 0}</span>
        </div>
        <div className="metric-card highlight-alt">
          <span className="metric-label">{t('admin.order_management.processing')}</span>
          <span className="metric-value">{counts.PAID || counts.Processing || 0}</span>
        </div>
        <div className="metric-card highlight">
          <span className="metric-label">{t('admin.order_management.shipping')}</span>
          <span className="metric-value">{counts.SHIPPING || counts.Shipping || 0}</span>
        </div>
        <div className="metric-card metric-card--complete">
          <span className="metric-label">{t('admin.order_management.completed')}</span>
          <span className="metric-value">{counts.DELIVERED || counts.Completed || 0}</span>
        </div>
      </div>

      <AdminModal
        isOpen={Boolean(selectedOrder)}
        title={selectedOrder ? `Đơn hàng #${orderDisplayId(selectedOrder)}` : 'Chi tiết đơn hàng'}
        subtitle="Kiểm tra khách hàng, thanh toán, vận chuyển và sản phẩm trong đơn."
        size="lg"
        onClose={() => setSelectedOrder(null)}
        footer={<button type="button" className="admin-btn admin-btn-outline" onClick={() => setSelectedOrder(null)}>Đóng</button>}
      >
        {selectedOrder && (
          <div className="admin-order-detail">
            <section className="admin-order-detail-hero">
              <div>
                <span className="admin-detail-label">Mã đơn hàng</span>
                <strong>#{orderDisplayId(selectedOrder)}</strong>
                <p>{orderItemsCount(selectedOrder)} sản phẩm nội thất · {orderDateLabel(selectedOrder)}</p>
              </div>
              <span className={`admin-badge ${orderStatus(selectedOrder).toLowerCase()}`}>
                {translateStatus(orderStatus(selectedOrder))}
              </span>
            </section>

            <div className="admin-detail-grid admin-detail-grid--order">
              <article className="admin-detail-panel">
                <h3>Khách hàng</h3>
                <dl className="admin-detail-listing">
                  <div>
                    <dt>Họ tên</dt>
                    <dd>{orderCustomerName(selectedOrder)}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{orderCustomerEmail(selectedOrder)}</dd>
                  </div>
                </dl>
              </article>

              <article className="admin-detail-panel">
                <h3>Thanh toán</h3>
                <dl className="admin-detail-listing">
                  <div>
                    <dt>Phương thức</dt>
                    <dd>{translatePayment(orderPaymentMethod(selectedOrder)) || '-'}</dd>
                  </div>
                  <div>
                    <dt>Tổng tiền</dt>
                    <dd className="admin-detail-money">{money(orderTotal(selectedOrder))}</dd>
                  </div>
                </dl>
              </article>

              <article className="admin-detail-panel admin-form-span-2">
                <h3>Giao hàng</h3>
                <p className="admin-detail-address">
                  {[selectedOrder.shippingAddress, selectedOrder.shippingCity, selectedOrder.shippingProvince].filter(Boolean).join(', ') || 'Chưa có địa chỉ giao hàng.'}
                </p>
              </article>

              <article className="admin-detail-panel admin-form-span-2">
                <div className="admin-detail-panel-head">
                  <h3>Sản phẩm trong đơn</h3>
                  <span>{orderItemsCount(selectedOrder)} dòng hàng</span>
                </div>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  <div className="admin-detail-items">
                    {selectedOrder.items.map((item, index) => {
                      const itemName = orderItemName(item, index);
                      const itemImage = orderItemImage(item);

                      return (
                        <div key={item.id || item.productId || index} className="admin-detail-item-row">
                          <div className="admin-detail-item-thumb" aria-hidden="true">
                            {itemImage ? (
                              <img src={itemImage} alt="" loading="lazy" />
                            ) : (
                              <i className="bi bi-box-seam" />
                            )}
                          </div>
                          <div>
                            <strong>{itemName}</strong>
                            <span>SL: {item.quantity || 1}</span>
                          </div>
                          <p>{money(Number(item.product?.price || item.product?.productPrice || item.price || item.unitPrice || 0))}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="admin-detail-address">{t('admin.order_management.items', { count: orderItemsCount(selectedOrder) })}</p>
                )}
              </article>
            </div>
          </div>
        )}
      </AdminModal>

      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <MagnifierIcon className="admin-search-icon" size={16} strokeWidth={2} />
          <input id="admin-orders-search" name="orderSearch" type="text" className="admin-search-input" placeholder={t('admin.order_management.search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select id="admin-orders-status-filter" name="orderStatusFilter" className="admin-filter-select" aria-label={t('admin.order_management.filter_label')} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">{t('admin.order_management.all_statuses')}</option>
          <option value="PAYMENT_EXPECTED">{t('admin.order_management.payment_expected')}</option>
          <option value="PAID">{t('admin.order_management.paid')}</option>
          <option value="DELIVERED">{t('admin.order_management.delivered')}</option>
          <option value="CANCELLED">{t('admin.order_management.cancelled')}</option>
        </select>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.order_management.order_id')}</th>
              <th>{t('admin.order_management.customer')}</th>
              <th>{t('admin.order_management.products')}</th>
              <th>{t('admin.order_management.payment')}</th>
              <th>{t('admin.order_management.status')}</th>
              <th>{t('admin.order_management.total')}</th>
              <th>{t('admin.order_management.order_date')}</th>
              <th className="admin-table-actions-head">{t('admin.order_management.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const id = orderDisplayId(o);
              const status = orderStatus(o);
              const customer = orderCustomerName(o);
              const email = orderCustomerEmail(o);
              const total = orderTotal(o);
              const date = orderDateLabel(o);
              const itemsCount = orderItemsCount(o);
              const payment = orderPaymentMethod(o);

              return (
                <tr key={id}>
                  <td className="admin-table-number">{id}</td>
                  <td>
                    <div className="admin-table-primary">{customer}</div>
                    <div className="admin-table-secondary">{email}</div>
                  </td>
                  <td>{t('admin.order_management.items', { count: itemsCount })}</td>
                  <td>{translatePayment(payment)}</td>
                  <td className="admin-table-nowrap">
                    <span className={`admin-badge ${status.toLowerCase()}`}>
                      {translateStatus(status)}
                    </span>
                  </td>
                  <td className="admin-table-number">{money(total)}</td>
                  <td className="admin-table-muted">{date}</td>
                  <td className="admin-table-actions-cell">
                    <div className="admin-action-group">
                      <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => setSelectedOrder(o)}>Chi tiết</button>
                      {status.toUpperCase() === 'PAYMENT_EXPECTED' && (
                        <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => handleUpdateStatus(id, 'PAID')}>{t('admin.order_management.confirm_payment')}</button>
                      )}
                      {status.toUpperCase() === 'PAID' && (
                        <button className="admin-btn admin-btn-outline admin-btn--small" onClick={() => handleUpdateStatus(id, 'DELIVERED')}>{t('admin.order_management.ship_order')}</button>
                      )}
                      <select
                        id={`admin-order-status-${id}`}
                        name={`orderStatus-${id}`}
                        value={status}
                        onChange={(e) => handleUpdateStatus(id, e.target.value)}
                        className="admin-filter-select admin-compact-select"
                        aria-label={t('admin.order_management.update_status')}
                      >
                        <option value="PAYMENT_EXPECTED">{t('admin.order_management.payment_expected')}</option>
                        <option value="PAID">{t('admin.order_management.paid')}</option>
                        <option value="DELIVERED">{t('admin.order_management.delivered')}</option>
                        <option value="CANCELLED">{t('admin.order_management.cancel_order')}</option>
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        {orders.length === 0 && !loading && (
          <div className="admin-empty">
            <h3>{t('admin.order_management.empty_title')}</h3>
            <p>{t('admin.order_management.empty_description')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
