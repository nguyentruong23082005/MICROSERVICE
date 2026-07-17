import { formatDate } from '../../../utils/formatters.js';

const BLANK = '\u2014';

export function orderDisplayId(order = {}) {
  return order.id ?? order.orderId;
}

export function orderStatus(order = {}) {
  return order.status || order.orderStatus || 'Pending';
}

export function orderCustomerName(order = {}) {
  return order.user?.userName || order.customer || order.customerName || order.userName || BLANK;
}

export function orderCustomerEmail(order = {}) {
  return order.user?.email || order.user?.userDetails?.email || order.email || order.customerEmail || BLANK;
}

export function orderTotal(order = {}) {
  return Number(order.total ?? order.totalAmount ?? order.amount ?? 0);
}

export function orderDateLabel(order = {}) {
  return formatDate(order.orderedDate || order.date || order.createdAt || order.orderDate);
}

export function orderItemsCount(order = {}) {
  if (Array.isArray(order.items)) return order.items.length;
  return Number(order.totalItems ?? order.itemCount ?? 0);
}

export function orderPaymentMethod(order = {}) {
  return order.payment || order.paymentMethod || '';
}
