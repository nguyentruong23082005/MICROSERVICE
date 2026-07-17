import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateItems } from './paginateItems.js';

const items = Array.from({ length: 23 }, (_, index) => ({ id: index + 1 }));

test('returns the requested one-based page without mutating the source', () => {
  const result = paginateItems(items, 2, 10);

  assert.deepEqual(result.items.map((item) => item.id), [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  assert.equal(result.totalPages, 3);
  assert.equal(result.totalItems, 23);
  assert.equal(items.length, 23);
});

test('clamps an out-of-range page to the final page', () => {
  const result = paginateItems(items, 99, 10);

  assert.equal(result.page, 3);
  assert.deepEqual(result.items.map((item) => item.id), [21, 22, 23]);
});

test('returns a stable empty page for invalid input', () => {
  assert.deepEqual(paginateItems(null, -1, 0), {
    items: [],
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });
});

