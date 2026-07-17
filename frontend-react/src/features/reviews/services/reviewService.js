import { del, get, post, put } from '../../../api/client.js';

const PREFIX = '/review';

export const getProductReviews = (productId) =>
  get(`${PREFIX}/reviews?productId=${encodeURIComponent(productId)}`);

export const getReviews = (status = 'ALL') =>
  get(`${PREFIX}/reviews?status=${encodeURIComponent(status)}`);

export const createReview = (userId, productId, review) =>
  post(`${PREFIX}/${userId}/reviews/${productId}`, review);

export const updateReviewStatus = (id, status) =>
  put(`${PREFIX}/reviews/${id}/status?status=${encodeURIComponent(status)}`);

export const deleteReview = (id) =>
  del(`${PREFIX}/reviews/${id}`);
