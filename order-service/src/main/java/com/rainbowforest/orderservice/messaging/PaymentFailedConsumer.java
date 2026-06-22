package com.rainbowforest.orderservice.messaging;

import com.rainbowforest.orderservice.event.PaymentFailedEvent;
import com.rainbowforest.orderservice.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Saga compensating action: khi thanh toán thất bại → huỷ đơn hàng.
 * Kho KHÔNG bị trừ (vì catalog chưa nhận PaymentCompleted) → không cần rollback kho.
 */
@Component
public class PaymentFailedConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentFailedConsumer.class);
    private final OrderService orderService;

    public PaymentFailedConsumer(OrderService orderService) {
        this.orderService = orderService;
    }

    @KafkaListener(
            topics = "${app.kafka.topics.payment-failed:payment-failed}",
            groupId = "order-service"
    )
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.info("[SAGA] PaymentFailed nhận cho order #{} — lý do: {} — cập nhật status → CANCELLED",
                event.getOrderId(), event.getReason());
        orderService.updateOrderStatus(event.getOrderId(), "CANCELLED");
    }
}
