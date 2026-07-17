import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailyRevenueSeries,
  buildDashboardSnapshot,
  normalizeCollection,
} from './dashboardMetrics.js';

test('normalizes arrays and paginated API payloads without exposing mutable references', () => {
  const source = { content: [{ id: 1 }, { id: 2 }] };
  const result = normalizeCollection(source);

  assert.deepEqual(result, source.content);
  assert.notEqual(result, source.content);
  assert.deepEqual(normalizeCollection([{ id: 3 }]), [{ id: 3 }]);
  assert.deepEqual(normalizeCollection(null), []);
});

test('builds inventory, category, status, and recent-order metrics without mutating inputs', () => {
  const products = [
    { id: 1, availability: 3, categoryRef: { name: 'Ghế' } },
    { id: 2, availability: 12, category: 'Bàn' },
    { id: 3, availability: 0, category: 'Ghế' },
  ];
  const users = [{ id: 1 }, { id: 2 }];
  const orders = [
    { id: 1, status: 'paid', createdAt: '2026-07-14T08:00:00Z' },
    { id: 2, orderStatus: 'DELIVERED', orderedDate: '2026-07-16T08:00:00Z' },
    { id: 3, status: 'unknown', createdAt: '2026-07-15T08:00:00Z' },
  ];
  const original = structuredClone({ products, users, orders });

  const snapshot = buildDashboardSnapshot({ products, users, orders, lowStockThreshold: 5 });

  assert.deepEqual(snapshot.stats, {
    products: 3,
    users: 2,
    categories: 2,
    stock: 15,
    lowStock: 2,
  });
  assert.deepEqual(snapshot.statusCounts, {
    CREATED: 0,
    PAID: 1,
    DELIVERED: 1,
    CANCELLED: 0,
    OTHER: 1,
  });
  assert.deepEqual(snapshot.recentOrders.map((order) => order.id), [2, 3, 1]);
  assert.deepEqual({ products, users, orders }, original);
});

test('builds a sorted daily revenue series from the real revenue map', () => {
  const dailyRevenue = {
    '2026-07-16': '4200000',
    '2026-07-14': 1500000,
    '2026-07-15': null,
  };

  const result = buildDailyRevenueSeries(dailyRevenue);

  assert.deepEqual(result, [
    { date: '2026-07-14', value: 1500000 },
    { date: '2026-07-15', value: 0 },
    { date: '2026-07-16', value: 4200000 },
  ]);
  assert.deepEqual(dailyRevenue, {
    '2026-07-16': '4200000',
    '2026-07-14': 1500000,
    '2026-07-15': null,
  });
});

test('returns stable empty metrics for malformed API data', () => {
  assert.deepEqual(buildDashboardSnapshot({ products: null, users: {}, orders: 'invalid' }), {
    stats: { products: 0, users: 0, categories: 0, stock: 0, lowStock: 0 },
    statusCounts: { CREATED: 0, PAID: 0, DELIVERED: 0, CANCELLED: 0, OTHER: 0 },
    recentOrders: [],
  });
  assert.deepEqual(buildDailyRevenueSeries(null), []);
});
