package com.rainbowforest.notificationservice.messaging;

import com.rainbowforest.notificationservice.event.OrderCreatedEvent;
import com.rainbowforest.notificationservice.service.NotificationService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumer lắng nghe sự kiện order-created từ Kafka.
 * Khi đơn hàng được tạo, ghi log thông báo và lưu notification vào database.
 */
@Component
public class OrderCreatedConsumer {

    private final NotificationService notificationService;

    public OrderCreatedConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(
        topics = "${app.kafka.topics.order-created:order-created}",
        groupId = "${spring.kafka.consumer.group-id:notification-service}"
    )
    public void handleOrderCreated(OrderCreatedEvent event) {
        notificationService.createOrderNotification(event);
    }
}
