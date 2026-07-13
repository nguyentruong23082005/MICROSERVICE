package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.Order;
import com.rainbowforest.orderservice.dto.ShippingInfoRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface OrderService {
    public Page<Order> searchOrdersAdmin(String status, String search, Pageable pageable);
    public Order saveOrder(Order order);
    public Order placeOrder(Long userId, String cartId, ShippingInfoRequest shippingInfo, boolean forceFailure);
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
