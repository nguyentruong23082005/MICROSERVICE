import { useState, useCallback } from 'react';
import { getRevenueStatistics, getPaymentsByOrderId } from '../services/paymentService.js';

export function usePayment() {
  const [revenue, setRevenue] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRevenueStatistics();
      setRevenue(data);
    } catch (err) {
      setError(err.message || 'Không thể tải thống kê doanh thu');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPaymentsForOrder = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPaymentsByOrderId(orderId);
      setPaymentDetails(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết thanh toán');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    revenue,
    paymentDetails,
    loading,
    error,
    fetchRevenue,
    fetchPaymentsForOrder,
  };
}

export default usePayment;
