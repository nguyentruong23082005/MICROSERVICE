package com.rainbowforest.orderservice.messaging;

import com.rainbowforest.orderservice.event.PaymentCompletedEvent;
import com.rainbowforest.orderservice.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Saga participant: order-service lắng nghe PaymentCompleted.
 * Khi thanh toán thành công → cập nhật status PAID → simulate giao hàng async → DELIVERED.
 * CompletableFuture.delayedExecutor đảm bảo Kafka consumer thread KHÔNG bị block.
 */
@Component
public class PaymentCompletedConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentCompletedConsumer.class);
    private final OrderService orderService;

    public PaymentCompletedConsumer(OrderService orderService) {
        this.orderService = orderService;
    }

    @KafkaListener(
            topics = "${app.kafka.topics.payment-completed:payment-completed}",
            groupId = "order-service"
    )
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        Long orderId = event.getOrderId();
        log.info("[SAGA] PaymentCompleted nhận cho order #{} — cập nhật status → PAID", orderId);

        // Cập nhật ngay: PAYMENT_EXPECTED → PAID
        orderService.updateOrderStatus(orderId, "PAID");

        // Simulate giao hàng async — Kafka consumer thread KHÔNG bị block
        CompletableFuture.delayedExecutor(2, TimeUnit.SECONDS)
                .execute(() -> {
                    orderService.updateOrderStatus(orderId, "DELIVERED");
                    log.info("[SAGA] Order #{} giao hàng thành công → DELIVERED", orderId);
                });
    }
}
