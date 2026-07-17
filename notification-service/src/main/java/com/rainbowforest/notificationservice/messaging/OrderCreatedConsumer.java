package com.rainbowforest.notificationservice.messaging;

import com.rainbowforest.notificationservice.event.OrderCreatedEvent;
import com.rainbowforest.notificationservice.service.EmailService;
import com.rainbowforest.notificationservice.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumer lắng nghe sự kiện order-created từ Kafka.
 * Khi đơn hàng được tạo, ghi log thông báo và lưu notification vào database.
 */
@Component
public class OrderCreatedConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderCreatedConsumer.class);
    private final NotificationService notificationService;
    private final EmailService emailService;

    public OrderCreatedConsumer(NotificationService notificationService, EmailService emailService) {
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @KafkaListener(
        topics = "${app.kafka.topics.order-created:order-created}",
        groupId = "${spring.kafka.consumer.group-id:notification-service}"
    )
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Received order-created event for order {}", event.getOrderId());
        notificationService.createOrderNotification(event);
        emailService.sendOrderConfirmation(event);
    }
}
