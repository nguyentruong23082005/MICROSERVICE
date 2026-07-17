import { del, get, post, put } from '../../../api/client.js';

const PREFIX = '/shop';

export const getAddresses = (userId) =>
  get(`${PREFIX}/${userId}/addresses`);

export const createAddress = (userId, address) =>
  post(`${PREFIX}/${userId}/addresses`, address);

export const setDefaultAddress = (userId, addressId) =>
  put(`${PREFIX}/${userId}/addresses/${addressId}/default`);

export const deleteAddress = (userId, addressId) =>
  del(`${PREFIX}/${userId}/addresses/${addressId}`);
