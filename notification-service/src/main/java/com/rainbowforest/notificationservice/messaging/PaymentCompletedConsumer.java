package com.rainbowforest.notificationservice.messaging;

import com.rainbowforest.notificationservice.event.PaymentCompletedEvent;
import com.rainbowforest.notificationservice.service.NotificationService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentCompletedConsumer {
    private final NotificationService notificationService;

    public PaymentCompletedConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "${app.kafka.topics.payment-completed:payment-completed}", groupId = "${spring.kafka.consumer.group-id:notification-service}")
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        notificationService.createPaymentNotification(event);
    }
}
