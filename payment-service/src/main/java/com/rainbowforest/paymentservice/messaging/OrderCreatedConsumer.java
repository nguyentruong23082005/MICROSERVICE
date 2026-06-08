package com.rainbowforest.paymentservice.messaging;

import com.rainbowforest.paymentservice.event.OrderCreatedEvent;
import com.rainbowforest.paymentservice.service.PaymentService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderCreatedConsumer {

    private final PaymentService paymentService;

    public OrderCreatedConsumer(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @KafkaListener(topics = "${app.kafka.topics.order-created:order-created}", groupId = "${spring.kafka.consumer.group-id:payment-service}")
    public void handleOrderCreated(OrderCreatedEvent event) {
        paymentService.processPayment(event);
    }
}
