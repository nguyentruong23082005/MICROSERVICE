import assert from 'node:assert/strict';
import test from 'node:test';

import {
  couponErrorMessage,
  normalizeCouponCode,
  normalizeCouponPreview,
} from './couponState.js';

test('normalizeCouponCode trims and uppercases customer input', () => {
  assert.equal(normalizeCouponCode('  summer 25  '), 'SUMMER 25');
  assert.equal(normalizeCouponCode(null), '');
});

test('normalizeCouponPreview preserves a valid server preview', () => {
  const result = normalizeCouponPreview({
    code: 'SAVE10',
    discountTotal: 125000,
    total: 1125000,
  }, 1250000);

  assert.deepEqual(result, {
    code: 'SAVE10',
    subtotal: 1250000,
    discountTotal: 125000,
    total: 1125000,
  });
});

test('normalizeCouponPreview clamps discount and total to safe monetary bounds', () => {
  const result = normalizeCouponPreview({
    code: ' free ',
    discountTotal: 900000,
    total: -200000,
  }, 500000);

  assert.deepEqual(result, {
    code: 'FREE',
    subtotal: 500000,
    discountTotal: 500000,
    total: 0,
  });
});

test('normalizeCouponPreview derives a consistent total when server numeric values are invalid', () => {
  const result = normalizeCouponPreview({
    code: 'SAVE50',
    discountTotal: 'not-a-number',
    total: undefined,
  }, 640000);

  assert.deepEqual(result, {
    code: 'SAVE50',
    subtotal: 640000,
    discountTotal: 0,
    total: 640000,
  });
});

test('couponErrorMessage distinguishes rejected coupons from connection failures', () => {
  assert.equal(
    couponErrorMessage({ status: 404 }),
    'Mã giảm giá không tồn tại hoặc chưa đủ điều kiện áp dụng.',
  );
  assert.equal(
    couponErrorMessage(new TypeError('Failed to fetch')),
    'Không thể kiểm tra mã giảm giá. Vui lòng kiểm tra kết nối và thử lại.',
  );
});
