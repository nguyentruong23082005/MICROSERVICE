package com.rainbowforest.orderservice.service;

import com.rainbowforest.orderservice.domain.Order;
import com.rainbowforest.orderservice.repository.OrderRepository;
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
}
