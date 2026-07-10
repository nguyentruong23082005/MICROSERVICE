package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.Order;
import com.rainbowforest.orderservice.repository.OrderRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OrderServiceImpl implements OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    @Autowired
    private OrderRepository orderRepository;

    @Override
    public Order saveOrder(Order order) {
        return orderRepository.save(order);
    }

    @Override
    public void updateOrderStatus(Long orderId, String status) {
        orderRepository.findById(orderId).ifPresentOrElse(
                order -> {
                    order.setStatus(status);
                    orderRepository.save(order);
                    log.info("[SAGA] Order #{} status → {}", orderId, status);
                },
                () -> log.warn("[SAGA] Order #{} not found when updating status to {}", orderId, status)
        );
    }

    @Override
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId).orElse(null);
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUser_IdOrderByOrderedDateDescIdDesc(userId);
    }

    @Override
    public Order cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order #" + orderId + " not found"));
        String status = order.getStatus();
        if ("DELIVERED".equals(status) || "CANCELLED".equals(status)) {
            throw new IllegalStateException(
                    "Order #" + orderId + " cannot be cancelled — current status: " + status);
        }
        order.setStatus("CANCELLED");
        Order saved = orderRepository.save(order);
        log.info("[ORDER] Order #{} cancelled", orderId);
        return saved;
    }
}
