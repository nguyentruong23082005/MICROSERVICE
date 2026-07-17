import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminGetProducts, adminGetUsers, adminGetOrders } from '../services/adminService.js';
import { usePayment } from '../../payment/index.js';
import { useNotification } from '../../notification/index.js';
import { money } from '../../../utils/formatters.js';
import { translateStatus } from '../../../utils/uiText.js';
import { OrderStatusChart, RevenueChart } from '../components/DashboardCharts.jsx';
import { buildDailyRevenueSeries, buildDashboardSnapshot } from '../utils/dashboardMetrics.js';
import {
  orderCustomerName,
  orderDateLabel,
  orderDisplayId,
  orderStatus,
  orderTotal,
} from '../../orders/utils/orderViewModel.js';

const LOW_STOCK_THRESHOLD = 5;


function escapeCsvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(() => buildDashboardSnapshot());
  const { revenue, loading: revenueLoading, error: revenueError, fetchRevenue } = usePayment();
  const {
    notifications,
    loading: notificationsLoading,
    error: notificationsError,
    fetchAdminNotifications,
  } = useNotification();
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const { stats, recentOrders, statusCounts } = snapshot;
  const loading = dataLoading || revenueLoading || notificationsLoading;
  const orderCount = Object.values(statusCounts).reduce((total, count) => total + count, 0);
  const revenueSeries = buildDailyRevenueSeries(revenue?.dailyRevenue);
  const dashboardErrors = [dataError, revenueError, notificationsError].filter(Boolean);

  const handleDownloadReport = () => {
    downloadCsv('admin-dashboard-report.csv', [
      [t('admin.dashboard.metric'), t('admin.dashboard.value')],
      [t('admin.dashboard.total_revenue'), revenue?.totalRevenue ?? 0],
      [t('admin.dashboard.total_orders'), orderCount],
      [t('admin.dashboard.products'), stats.products],
      [t('admin.dashboard.customers'), stats.users],
      [t('admin.dashboard.total_stock'), stats.stock],
      [t('admin.dashboard.low_stock_products'), stats.lowStock],
      [],
      [
        t('admin.dashboard.order_id'),
        t('admin.dashboard.customer'),
        t('admin.dashboard.order_date'),
        t('admin.dashboard.status'),
        t('admin.dashboard.total'),
      ],
      ...recentOrders.map((order) => [
        orderDisplayId(order),
        orderCustomerName(order),
        orderDateLabel(order),
        translateStatus(orderStatus(order)),
        orderTotal(order),
      ]),
    ]);
  };

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setDataLoading(true);
      setDataError(null);

      try {
        // Verify the admin cookie once before fanning out to secondary services.
        // A rejected session triggers the global auth handler and stops the request storm.
        const orders = await adminGetOrders();
        if (!active) return;

        fetchRevenue();
        fetchAdminNotifications();
        const results = await Promise.allSettled([
          adminGetProducts(),
          adminGetUsers(),
        ]);
        if (!active) return;

        const failedCount = results.filter((result) => result.status === 'rejected').length;
        setSnapshot(buildDashboardSnapshot({
          products: results[0].status === 'fulfilled' ? results[0].value : [],
          users: results[1].status === 'fulfilled' ? results[1].value : [],
          orders,
          lowStockThreshold: LOW_STOCK_THRESHOLD,
        }));
        setDataError(failedCount > 0
          ? `Không thể tải ${failedCount} nguồn dữ liệu quản trị. Các phần còn lại vẫn được hiển thị.`
          : null);
      } catch (error) {
        if (!active) return;
        setDataError(error.message || 'Phiên quản trị không còn hợp lệ.');
      } finally {
        if (active) setDataLoading(false);
      }
    }

    loadDashboard();
    return () => { active = false; };
  }, [fetchRevenue, fetchAdminNotifications]);



  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-intro" aria-labelledby="admin-dashboard-title">
        <div>
          <span className="admin-dashboard-eyebrow">{t('admin.dashboard.business_overview')}</span>
          <h1 id="admin-dashboard-title" className="admin-page-title">{t('admin.dashboard.title')}</h1>
          <p className="admin-subtitle">{t('admin.dashboard.description')}</p>
        </div>
        <button
          id="admin-dashboard-download-report"
          className="admin-btn admin-btn-primary"
          type="button"
          onClick={handleDownloadReport}
          disabled={loading}
        >
          <i className="bi bi-download" aria-hidden="true" />
          {t('admin.dashboard.download_report')}
        </button>
      </header>

      {dashboardErrors.length > 0 && (
        <section className="admin-dashboard-alert" role="alert">
          <i className="bi bi-exclamation-circle" aria-hidden="true" />
          <div>
            <strong>Một số dữ liệu chưa tải được</strong>
            {dashboardErrors.map((error, index) => (
              <p key={`${index}-${error}`}>{error}</p>
            ))}
          </div>
        </section>
      )}

      <section className="admin-dashboard-metrics" aria-label={t('admin.dashboard.metric')}>
        <article className="admin-dashboard-metric admin-dashboard-metric--revenue">
          <div className="admin-dashboard-metric__top">
            <span className="admin-dashboard-metric__label">{t('admin.dashboard.total_revenue')}</span>
            <span className="admin-dashboard-metric__icon"><i className="bi bi-graph-up-arrow" aria-hidden="true" /></span>
          </div>
          <strong className="admin-dashboard-metric__value">{revenueLoading ? '…' : money(revenue?.totalRevenue ?? 0)}</strong>
          <span className="admin-dashboard-metric__note">Dữ liệu từ giao dịch thanh toán thành công</span>
        </article>
        <article className="admin-dashboard-metric">
          <div className="admin-dashboard-metric__top">
            <span className="admin-dashboard-metric__label">{t('admin.dashboard.total_orders')}</span>
            <span className="admin-dashboard-metric__icon"><i className="bi bi-receipt" aria-hidden="true" /></span>
          </div>
          <strong className="admin-dashboard-metric__value">{dataLoading ? '…' : orderCount}</strong>
          <span className="admin-dashboard-metric__note">Đơn hàng hiện có trong hệ thống</span>
        </article>
        <article className="admin-dashboard-metric">
          <div className="admin-dashboard-metric__top">
            <span className="admin-dashboard-metric__label">{t('admin.dashboard.products')}</span>
            <span className="admin-dashboard-metric__icon"><i className="bi bi-box-seam" aria-hidden="true" /></span>
          </div>
          <strong className="admin-dashboard-metric__value">{dataLoading ? '…' : stats.products}</strong>
          <span className="admin-dashboard-metric__note">{t('admin.dashboard.categories_note', { count: stats.categories })}</span>
        </article>
        <article className="admin-dashboard-metric">
          <div className="admin-dashboard-metric__top">
            <span className="admin-dashboard-metric__label">{t('admin.dashboard.customers')}</span>
            <span className="admin-dashboard-metric__icon"><i className="bi bi-people" aria-hidden="true" /></span>
          </div>
          <strong className="admin-dashboard-metric__value">{dataLoading ? '…' : stats.users}</strong>
          <span className="admin-dashboard-metric__note">Tài khoản thực từ dịch vụ người dùng</span>
        </article>
      </section>

      <section className="admin-dashboard-grid admin-dashboard-grid--charts" aria-label="Biểu đồ kinh doanh">
        <article className="admin-card admin-dashboard-panel">
          <div className="admin-dashboard-panel__head">
            <div>
              <span className="admin-dashboard-eyebrow">Thanh toán</span>
              <h2>Doanh thu theo ngày</h2>
            </div>
            <span className="admin-dashboard-source">Payment API</span>
          </div>
          <div className="admin-dashboard-panel__body">
            <RevenueChart series={revenueSeries} />
          </div>
        </article>

        <article className="admin-card admin-dashboard-panel" id="orders-by-status-card">
          <div className="admin-dashboard-panel__head">
            <div>
              <span className="admin-dashboard-eyebrow">Đơn hàng</span>
              <h2>{t('admin.dashboard.orders_by_status')}</h2>
            </div>
            <span className="admin-dashboard-source">{orderCount} đơn</span>
          </div>
          <div className="admin-dashboard-panel__body">
            <OrderStatusChart counts={statusCounts} />
          </div>
        </article>
      </section>

      <section className="admin-dashboard-grid admin-dashboard-grid--operations" aria-label={t('admin.dashboard.operations_status')}>
        <article className="admin-card admin-dashboard-panel" id="low-stock-card">
          <div className="admin-dashboard-panel__head">
            <h2>{t('admin.dashboard.low_stock')}</h2>
            <span className={`admin-badge ${stats.lowStock > 0 ? 'cancelled' : 'active'}`}>
              {t(stats.lowStock > 0 ? 'admin.dashboard.needs_attention' : 'admin.dashboard.stable')}
            </span>
          </div>
          <div className="admin-dashboard-panel__body">
            <div className="admin-dashboard-low-stock">
              <strong>{dataLoading ? '…' : stats.lowStock}</strong>
              <span>{t('admin.dashboard.low_stock_count', { threshold: LOW_STOCK_THRESHOLD })}</span>
            </div>
            <div className="admin-dashboard-inventory-total">
              <span>Tổng tồn kho</span>
              <strong>{dataLoading ? '…' : stats.stock}</strong>
            </div>
          </div>
        </article>

        <article className="admin-card admin-dashboard-panel admin-dashboard-panel--notifications">
          <div className="admin-dashboard-panel__head">
            <div>
              <span className="admin-dashboard-eyebrow">Hệ thống</span>
              <h2>{t('admin.dashboard.system_notifications')}</h2>
            </div>
            <button
              id="admin-dashboard-view-notifications"
              className="admin-btn admin-btn-outline"
              type="button"
              onClick={() => navigate('/admin/notifications')}
            >
              {t('admin.dashboard.view_all')}
            </button>
          </div>
          <div className="admin-dashboard-panel__body">
            <div className="admin-dashboard-activity">
              {notifications.slice(0, 4).map((notification, index) => (
                <div className="admin-dashboard-activity__item" key={notification.id || index}>
                  <span className="admin-dashboard-activity__dot" aria-hidden="true" />
                  <div>
                    <strong>{notification.message}</strong>
                    <small>{translateStatus(notification.category || 'SYSTEM')} · {translateStatus(notification.status || 'PROCESSED')}</small>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && !notificationsLoading && (
                <div className="admin-empty"><p>{t('admin.dashboard.no_notifications')}</p></div>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="admin-card admin-dashboard-panel" aria-labelledby="recent-orders-title">
        <div className="admin-dashboard-panel__head">
          <div>
            <span className="admin-dashboard-eyebrow">{t('admin.dashboard.recent_sales')}</span>
            <h2 id="recent-orders-title">{t('admin.dashboard.recent_orders')}</h2>
          </div>
          <button
            id="admin-dashboard-view-orders"
            className="admin-btn admin-btn-outline"
            type="button"
            onClick={() => navigate('/admin/orders')}
          >
            {t('admin.dashboard.view_all')}
          </button>
        </div>
        <div className="admin-table-container admin-dashboard-table">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.dashboard.order_id')}</th>
                <th>{t('admin.dashboard.customer')}</th>
                <th>{t('admin.dashboard.order_date')}</th>
                <th>{t('admin.dashboard.status')}</th>
                <th>{t('admin.dashboard.total')}</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const id = orderDisplayId(order);
                const status = orderStatus(order);
                return (
                  <tr key={id}>
                    <td><strong>{id}</strong></td>
                    <td>{orderCustomerName(order)}</td>
                    <td>{orderDateLabel(order)}</td>
                    <td><span className={`admin-badge ${status.toLowerCase()}`}>{translateStatus(status)}</span></td>
                    <td>{money(orderTotal(order))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recentOrders.length === 0 && !dataLoading && (
            <div className="admin-empty"><p>{t('admin.dashboard.no_recent_orders')}</p></div>
          )}
        </div>
      </section>
    </div>
  );
}
