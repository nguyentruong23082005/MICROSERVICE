const DASHBOARD_STATUSES = ['CREATED', 'PAID', 'DELIVERED', 'CANCELLED'];
const DEFAULT_LOW_STOCK_THRESHOLD = 5;
const RECENT_ORDER_LIMIT = 5;

export function normalizeCollection(payload) {
  if (Array.isArray(payload)) return [...payload];
  if (Array.isArray(payload?.content)) return [...payload.content];
  return [];
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function orderStatusValue(order) {
  return String(order?.status || order?.orderStatus || 'CREATED').toUpperCase();
}

function orderTimestamp(order) {
  const value = order?.orderedDate || order?.date || order?.createdAt || order?.orderDate;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function buildDailyRevenueSeries(dailyRevenue) {
  if (!dailyRevenue || typeof dailyRevenue !== 'object' || Array.isArray(dailyRevenue)) return [];

  return Object.entries(dailyRevenue)
    .map(([date, value]) => ({ date, value: safeNumber(value) }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function buildDashboardSnapshot({
  products,
  users,
  orders,
  lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD,
} = {}) {
  const productList = normalizeCollection(products);
  const userList = normalizeCollection(users);
  const orderList = normalizeCollection(orders);
  const categoryNames = new Set(
    productList
      .map((product) => product?.categoryRef?.name || product?.category)
      .filter(Boolean),
  );
  const statusCounts = orderList.reduce((counts, order) => {
    const status = orderStatusValue(order);
    const key = DASHBOARD_STATUSES.includes(status) ? status : 'OTHER';
    return { ...counts, [key]: counts[key] + 1 };
  }, { CREATED: 0, PAID: 0, DELIVERED: 0, CANCELLED: 0, OTHER: 0 });

  return {
    stats: {
      products: productList.length,
      users: userList.length,
      categories: categoryNames.size,
      stock: productList.reduce((total, product) => total + safeNumber(product?.availability), 0),
      lowStock: productList.filter(
        (product) => safeNumber(product?.availability) <= lowStockThreshold,
      ).length,
    },
    statusCounts,
    recentOrders: [...orderList]
      .sort((left, right) => orderTimestamp(right) - orderTimestamp(left))
      .slice(0, RECENT_ORDER_LIMIT),
  };
}
