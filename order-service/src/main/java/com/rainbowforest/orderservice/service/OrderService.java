package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.Order;
import java.util.List;

public interface OrderService {
    public Order saveOrder(Order order);
    public void updateOrderStatus(Long orderId, String status);
    public Order getOrderById(Long orderId);
    public List<Order> getAllOrders();
    public List<Order> getOrdersByUserId(Long userId);
    /**
     * Huỷ đơn hàng. Chỉ cho phép huỷ khi status chưa phải DELIVERED hoặc CANCELLED.
     * @throws IllegalArgumentException nếu không tìm thấy order
     * @throws IllegalStateException    nếu order không thể huỷ (đã giao hoặc đã huỷ)
     */
    public Order cancelOrder(Long orderId);
}
