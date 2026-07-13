import { get, post, put, del } from '../../../api/client.js';

const CATALOG = '/catalog';
const ACCOUNTS = '/accounts';
const SHOP = '/shop';

export const adminGetProducts = (page, size, filters = {}) => {
  if (page === undefined || size === undefined) return get(`${CATALOG}/products`);
  let url = `${CATALOG}/products?page=${page}&size=${size}`;
  if (filters.name) url += `&name=${encodeURIComponent(filters.name)}`;
  if (filters.category) url += `&category=${encodeURIComponent(filters.category)}`;
  if (filters.inStock !== undefined && filters.inStock !== '') url += `&inStock=${filters.inStock}`;
  return get(url);
};
export const adminCreateProduct = (data) => post(`${CATALOG}/admin/products`, data);
export const adminUpdateProduct = (id, data) => put(`${CATALOG}/admin/products/${id}`, data);
export const adminDeleteProduct = (id) => del(`${CATALOG}/admin/products/${id}`);

export const adminGetCategories = () => get(`${CATALOG}/admin/categories`);
export const adminCreateCategory = (data) => post(`${CATALOG}/admin/categories`, data);
export const adminUpdateCategory = (id, data) => put(`${CATALOG}/admin/categories/${id}`, data);
export const adminDeleteCategory = (id) => del(`${CATALOG}/admin/categories/${id}`);

export const adminGetContentPages = () => get(`${CATALOG}/admin/content-pages`);
export const adminCreateContentPage = (data) => post(`${CATALOG}/admin/content-pages`, data);
export const adminUpdateContentPage = (id, data) => put(`${CATALOG}/admin/content-pages/${id}`, data);
export const adminDeleteContentPage = (id) => del(`${CATALOG}/admin/content-pages/${id}`);

export const adminGetOrders = (page, size, filters = {}) => {
  if (page === undefined || size === undefined) return get(`${SHOP}/orders`);
  let url = `${SHOP}/orders?page=${page}&size=${size}`;
  if (filters.status) url += `&status=${encodeURIComponent(filters.status)}`;
  if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
  return get(url);
};
export const adminUpdateOrderStatus = (orderId, status) =>
  put(`${SHOP}/order/${orderId}/status?status=${encodeURIComponent(status)}`);

export const adminGetCoupons = () => get(`${SHOP}/admin/coupons`);
export const adminCreateCoupon = (data) => post(`${SHOP}/admin/coupons`, data);
export const adminUpdateCoupon = (id, data) => put(`${SHOP}/admin/coupons/${id}`, data);
export const adminDeleteCoupon = (id) => del(`${SHOP}/admin/coupons/${id}`);

export const adminGetUsers = (page, size, search = '') => {
  if (page === undefined || size === undefined) return get(`${ACCOUNTS}/admin/users`);
  let url = `${ACCOUNTS}/admin/users?page=${page}&size=${size}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  return get(url);
};
export const adminCreateUser = (data) => post(`${ACCOUNTS}/admin/users`, data);
export const adminGetUserById = (id) => get(`${ACCOUNTS}/admin/users/${id}`);
export const adminUpdateUserStatus = (id, active) =>
  put(`${ACCOUNTS}/admin/users/${id}/status?active=${active}`);
export const adminUpdateUserRole = (id, roleName) =>
  put(`${ACCOUNTS}/admin/users/${id}/role?roleName=${encodeURIComponent(roleName)}`);
