/** Định dạng tiền VND */
export function money(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(value || 0));
}

/** Escape HTML để tránh XSS */
export function escapeHtml(str = '') {
  return String(str).replace(/[&<>'"`]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;', '`': '&#96;' }[c])
  );
}

/** Định dạng ngày */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

/** Rút gọn text */
export function truncate(str = '', maxLen = 80) {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/** Lấy initials từ tên (cho avatar) */
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
