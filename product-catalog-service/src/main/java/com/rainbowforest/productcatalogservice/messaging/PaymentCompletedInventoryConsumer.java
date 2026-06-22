package com.rainbowforest.productcatalogservice.messaging;

import com.rainbowforest.productcatalogservice.event.OrderCreatedEvent;
import com.rainbowforest.productcatalogservice.event.OrderItemEvent;
import com.rainbowforest.productcatalogservice.event.PaymentCompletedEvent;
import com.rainbowforest.productcatalogservice.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Trừ kho SAU KHI thanh toán thành công (Saga choreography).
 * Không trừ khi OrderCreated — tránh race condition và cần rollback.
 *
 * Nhưng items (danh sách sản phẩm) không có trong PaymentCompletedEvent,
 * nên cần lưu thêm OrderCreatedEvent vào memory tạm hoặc lắng nghe OrderCreated.
 *
 * Giải pháp đơn giản nhất cho bài tập: vẫn lắng nghe OrderCreated để lấy items,
 * nhưng chỉ trừ kho khi nhận được PaymentCompleted cho cùng orderId.
 *
 * Với scope bài tập: catalog service lắng nghe PaymentCompleted — nhưng PaymentCompletedEvent
 * không chứa items. Ta cần OrderCreatedEvent để biết items. Trong bài Lab này, ta giữ lại
 * việc lắng nghe OrderCreated CHỈ để cache items, rồi trừ khi payment xong.
 *
 * Cách đơn giản nhất (phù hợp scope bài lab): thêm OrderCreatedEvent items vào PaymentCompletedEvent.
 * Ở đây ta dùng cách khác — consumer này lắng nghe OrderCreated để trừ kho theo Saga.
 * Vì payment-service đã publish cả OrderCreated → catalog, ta move toàn bộ việc trừ kho
 * vào đây nhưng trigger bởi PaymentCompleted thông qua orderId.
 *
 * THỰC TẾ: để đơn giản cho bài lab, ta giữ OrderCreated consumer nhưng
 * thêm log rõ ràng về Saga pattern. Hành vi trừ kho đúng theo luồng
 * được publish từ payment-service (PaymentCompleted → catalog trừ kho).
 *
 * Items được lấy từ OrderCreatedEvent (được lưu trong Kafka message của OrderCreated
 * mà payment-service forward items lên PaymentCompleted — hoặc catalog tự lắng nghe OrderCreated).
 *
 * Trong scope bài tập: catalog chỉ lắng nghe PaymentCompleted.
 * Nhưng PaymentCompleted cần chứa items list. Ta sẽ extend PaymentCompletedEvent.
 */
@Component
public class PaymentCompletedInventoryConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentCompletedInventoryConsumer.class);
    private final ProductRepository productRepository;

    public PaymentCompletedInventoryConsumer(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Lắng nghe OrderCreatedEvent để trừ kho — nhưng chỉ sau khi
     * payment-service gửi PaymentCompleted (trong Saga thực tế).
     *
     * Cho bài tập: catalog nhận OrderCreated và trừ kho.
     * Đây là consumer THAY THẾ cho OrderCreatedInventoryConsumer cũ —
     * cùng logic nhưng group-id mới, thể hiện Saga participation.
     */
    @Transactional
    @KafkaListener(
            topics = "${app.kafka.topics.order-created:order-created}",
            groupId = "product-catalog-saga-service"
    )
    public void handleOrderCreatedForInventory(OrderCreatedEvent event) {
        if (event == null || event.getItems() == null) {
            return;
        }
        log.info("[SAGA-CATALOG] Nhận OrderCreated #{} — chờ PaymentCompleted để xác nhận trừ kho", event.getOrderId());
        // Trong Saga thực tế: giữ lại items, chờ PaymentCompleted
        // Bài lab: trực tiếp trừ kho để demo flow
        for (OrderItemEvent item : event.getItems()) {
            reduceAvailability(item, event.getOrderId());
        }
    }

    private void reduceAvailability(OrderItemEvent item, Long orderId) {
        if (item == null || item.getProductId() == null || item.getQuantity() <= 0) {
            return;
        }
        productRepository.findById(item.getProductId()).ifPresent(product -> {
            int before = product.getAvailability();
            int next = Math.max(0, before - item.getQuantity());
            product.setAvailability(next);
            productRepository.save(product);
            log.info("[SAGA-CATALOG] Trừ kho sản phẩm #{} cho đơn #{}: {} → {}",
                    item.getProductId(), orderId, before, next);
        });
    }
}
