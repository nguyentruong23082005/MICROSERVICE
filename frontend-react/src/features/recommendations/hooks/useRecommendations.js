import { useState, useCallback } from 'react';
import { getRecommendationsByProductName, createRecommendation, deleteRecommendation } from '../services/recommendationService.js';

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async (productName) => {
    if (!productName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRecommendationsByProductName(productName);
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err) {
      setRecommendations([]);
      // 404 means no recommendations found yet, which is normal
      if (err.status !== 404) {
        setError(err.message || 'Không thể tải danh sách đánh giá');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const addRecommendation = useCallback(async (userId, productId, rating, productName) => {
    setLoading(true);
    setError(null);
    try {
      await createRecommendation(userId, productId, rating);
      if (productName) {
        await fetchRecommendations(productName);
      }
    } catch (err) {
      setError(err.message || 'Đăng đánh giá thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRecommendations]);

  const removeRecommendation = useCallback(async (id, productName) => {
    setLoading(true);
    setError(null);
    try {
      await deleteRecommendation(id);
      if (productName) {
        await fetchRecommendations(productName);
      }
    } catch (err) {
      setError(err.message || 'Xóa đánh giá thất bại');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    fetchRecommendations,
    addRecommendation,
    removeRecommendation,
  };
}

export default useRecommendations;
