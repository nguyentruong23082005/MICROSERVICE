const CATEGORY_LABELS = {
  'Living Room': 'Phòng khách',
  Bedroom: 'Phòng ngủ',
  'Dining Room': 'Phòng ăn',
  Workspace: 'Góc làm việc',
  Lighting: 'Đèn trang trí',
  Storage: 'Lưu trữ',
  Seating: 'Ghế ngồi',
  Tables: 'Bàn',
};

const STATUS_LABELS = {
  Pending: 'Đang chờ',
  Processing: 'Đang xử lý',
  Shipping: 'Đang giao',
  Completed: 'Hoàn tất',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
  Canceled: 'Đã hủy',
  Active: 'Đang bán',
  Blocked: 'Đã khóa',
  SYSTEM: 'Hệ thống',
  PROCESSED: 'Đã xử lý',
  PAYMENT_EXPECTED: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  COMPLETED: 'Hoàn tất',
  FAILED: 'Thất bại',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  DELIVERED: 'Đã giao hàng',
  CANCELLED: 'Đã hủy',
  SENT: 'Đã gửi',
  ORDER_PLACED: 'Đã đặt hàng',
  PENDING: 'Đang chờ',
  APPROVED: 'Đã duyệt',
  HIDDEN: 'Đã ẩn',
};

const PAYMENT_LABELS = {
  COD: 'Thanh toán khi nhận hàng',
  CASH: 'Tiền mặt',
  CARD: 'Thẻ thanh toán',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
};

export const translateCategory = (value, fallback = 'Nội thất') => CATEGORY_LABELS[value] || value || fallback;

export const translateStatus = (value, fallback = 'Đang chờ') => STATUS_LABELS[value] || value || fallback;

export const translatePayment = (value, fallback = 'Chưa cập nhật') => PAYMENT_LABELS[value] || value || fallback;

export const translateMaterial = (value, fallback = 'Chưa cập nhật') => value || fallback;

export const translateColor = (value, fallback = 'Chưa cập nhật') => value || fallback;

export const ROOM_CATEGORIES = [
  { value: 'Living Room', label: 'Phòng khách' },
  { value: 'Bedroom', label: 'Phòng ngủ' },
  { value: 'Dining Room', label: 'Phòng ăn' },
  { value: 'Workspace', label: 'Góc làm việc' },
];
