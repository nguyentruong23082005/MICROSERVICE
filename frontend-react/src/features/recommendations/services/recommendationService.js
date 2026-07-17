import { del, get, post } from '../../../api/client.js';

const PREFIX = '/review';

export const getRecommendationsByProductName = (productName) =>
  get(`${PREFIX}/recommendations?name=${encodeURIComponent(productName)}`);

export const createRecommendation = (userId, productId, rating) =>
  post(`${PREFIX}/${userId}/recommendations/${productId}?rating=${rating}`);

export const deleteRecommendation = (id) =>
  del(`${PREFIX}/recommendations/${id}`);
