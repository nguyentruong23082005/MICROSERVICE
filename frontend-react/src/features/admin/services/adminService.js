import { get, post, put, del } from '../../../api/client.js';

const CATALOG = '/catalog';
const ACCOUNTS = '/accounts';
const SHOP = '/shop';

/** Sản phẩm */
export const adminGetProducts = () => get(`${CATALOG}/products`);
export const adminCreateProduct = (data) => post(`${CATALOG}/admin/products`, data);
export const adminUpdateProduct = (id, data) => put(`${CATALOG}/admin/products/${id}`, data);
export const adminDeleteProduct = (id) => del(`${CATALOG}/admin/products/${id}`);

/** Đơn hàng */
export const adminGetOrders = () => get(`${SHOP}/orders`);

/** Users */
export const adminGetUsers = () => get(`${ACCOUNTS}/users`);
export const adminCreateUser = (data) => post(`${ACCOUNTS}/users`, data);
export const adminGetUserById = (id) => get(`${ACCOUNTS}/users/${id}`);
