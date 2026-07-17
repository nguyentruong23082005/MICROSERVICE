import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getPageAfterProductDeletion } from './productDeletion.js';

const SOURCE_ROOT = new URL('../../../', import.meta.url);

test('deleting the only row on a later page moves to the preceding page', () => {
  assert.equal(getPageAfterProductDeletion({ currentPage: 3, itemCount: 1 }), 2);
});

test('deleting one of several rows keeps the current page', () => {
  assert.equal(getPageAfterProductDeletion({ currentPage: 3, itemCount: 2 }), 3);
  assert.equal(getPageAfterProductDeletion({ currentPage: 1, itemCount: 1 }), 1);
});

test('product deletion keeps an explicit in-flight id and reports backend errors', async () => {
  const source = await readFile(new URL('features/admin/pages/Products.jsx', SOURCE_ROOT), 'utf8');

  assert.match(source, /const \[deletingId, setDeletingId\] = useState\(null\)/);
  assert.match(source, /if \(deletingId !== null\) return/);
  assert.match(source, /disabled=\{deletingId === product\.id\}/);
  assert.match(source, /err\.message \|\| 'Không thể xoá sản phẩm\.'/);
  assert.match(source, /setProducts\(previous => previous\.filter/);
  assert.match(source, /getPageAfterProductDeletion/);
});