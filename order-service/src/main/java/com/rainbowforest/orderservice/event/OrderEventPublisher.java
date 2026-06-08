package com.rainbowforest.orderservice.event;

import com.rainbowforest.orderservice.domain.Item;
import com.rainbowforest.orderservice.domain.Order;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OrderEventPublisher {

    private final KafkaTemplate<String, OrderCreatedEvent> kafkaTemplate;
    private final String orderCreatedTopic;

    public OrderEventPublisher(
            KafkaTemplate<String, OrderCreatedEvent> kafkaTemplate,
            @Value("${app.kafka.topics.order-created:order-created}") String orderCreatedTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.orderCreatedTopic = orderCreatedTopic;
    }

    public void publishOrderCreated(Order order) {
        OrderCreatedEvent event = toEvent(order);
        kafkaTemplate.send(orderCreatedTopic, String.valueOf(order.getId()), event);
    }

    private OrderCreatedEvent toEvent(Order order) {
        Long userId = order.getUser() == null ? null : order.getUser().getId();
        List<OrderItemEvent> items = order.getItems() == null
                ? List.of()
                : order.getItems().stream().map(this::toItemEvent).toList();

        return new OrderCreatedEvent(
                order.getId(),
                userId,
                order.getTotal(),
                order.getStatus(),
                order.getOrderedDate(),
                items
        );
    }

    private OrderItemEvent toItemEvent(Item item) {
        Long productId = item.getProduct() == null ? null : item.getProduct().getId();
        String productName = item.getProduct() == null ? null : item.getProduct().getProductName();
        return new OrderItemEvent(productId, productName, item.getQuantity(), item.getSubTotal());
    }
}
