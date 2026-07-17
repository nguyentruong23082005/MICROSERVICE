import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildProductCatalogQuery,
  normalizeProductPage,
} from './productCatalog.js';

test('builds a bounded, encoded server-side catalog query', () => {
  const query = buildProductCatalogQuery({
    page: 3,
    size: 12,
    name: 'bàn ăn & ghế',
    category: 'phòng khách',
    inStock: true,
  });

  assert.equal(
    query,
    '?page=2&size=12&name=b%C3%A0n+%C4%83n+%26+gh%E1%BA%BF&category=ph%C3%B2ng+kh%C3%A1ch&inStock=true',
  );
});

test('rejects invalid page and page-size values at the client boundary', () => {
  assert.throws(() => buildProductCatalogQuery({ page: 0 }), /positive integer/);
  assert.throws(() => buildProductCatalogQuery({ page: 1, size: 101 }), /between 1 and 100/);
});

test('omits blank optional filters instead of sending ambiguous parameters', () => {
  assert.equal(
    buildProductCatalogQuery({ page: 1, size: 12, name: '  ', category: '' }),
    '?page=0&size=12',
  );
});

test('normalizes a Spring Page response for storefront consumption', () => {
  const page = normalizeProductPage({
    content: [{ id: 7 }],
    number: 1,
    size: 12,
    totalElements: 25,
    totalPages: 3,
  });

  assert.deepEqual(page, {
    items: [{ id: 7 }],
    page: 2,
    pageSize: 12,
    totalItems: 25,
    totalPages: 3,
  });
});

test('normalizes legacy array responses without mutating them', () => {
  const products = [{ id: 1 }, { id: 2 }];
  const page = normalizeProductPage(products);

  assert.deepEqual(page.items, products);
  assert.notEqual(page.items, products);
  assert.equal(page.totalItems, 2);
  assert.equal(page.totalPages, 1);
});
