function safeMoney(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : fallback;
}

export function normalizeCouponCode(value) {
  return String(value ?? '').trim().toUpperCase();
}

export function normalizeCouponPreview(preview = {}, cartSubtotal = 0) {
  const subtotal = safeMoney(cartSubtotal);
  const rawDiscount = safeMoney(preview.discountTotal);
  const discountTotal = Math.min(rawDiscount, subtotal);
  const expectedTotal = subtotal - discountTotal;
  const serverTotal = safeMoney(preview.total, expectedTotal);
  const total = Math.min(serverTotal, expectedTotal);

  return Object.freeze({
    code: normalizeCouponCode(preview.code),
    subtotal,
    discountTotal,
    total,
  });
}

export function couponErrorMessage(error) {
  if (error?.status === 404 || error?.status === 400) {
    return 'Mã giảm giá không tồn tại hoặc chưa đủ điều kiện áp dụng.';
  }

  return 'Không thể kiểm tra mã giảm giá. Vui lòng kiểm tra kết nối và thử lại.';
}
