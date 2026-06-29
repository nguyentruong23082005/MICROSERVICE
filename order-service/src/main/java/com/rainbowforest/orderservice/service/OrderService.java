package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.Order;

public interface OrderService {
    public Order saveOrder(Order order);
    public void updateOrderStatus(Long orderId, String status);
    public Order getOrderById(Long orderId);
}
