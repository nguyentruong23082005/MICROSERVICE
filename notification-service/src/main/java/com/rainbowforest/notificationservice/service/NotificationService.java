package com.rainbowforest.notificationservice.service;

import com.rainbowforest.notificationservice.domain.Notification;
import com.rainbowforest.notificationservice.event.OrderCreatedEvent;
import com.rainbowforest.notificationservice.event.PaymentCompletedEvent;
import com.rainbowforest.notificationservice.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /** Tạo notification USER khi thanh toán thành công + đồng thời tạo ADMIN notification */
    public Notification createPaymentNotification(PaymentCompletedEvent event) {
        // USER notification
        Notification userNotif = new Notification();
        userNotif.setUserId(event.getUserId());
        userNotif.setOrderId(event.getOrderId());
        userNotif.setPaymentId(event.getPaymentId());
        userNotif.setType("USER");
        userNotif.setCategory("PAYMENT");
        userNotif.setStatus("SENT");
        userNotif.setCreatedAt(LocalDateTime.now());
        userNotif.setMessage("Thanh toán thành công cho đơn hàng #" + event.getOrderId()
                + " với số tiền " + event.getAmount());
        userNotif.setMetadata(Map.of("paymentId", event.getPaymentId(), "amount", event.getAmount()));
        notificationRepository.save(userNotif);
        log.info("[NOTIFICATION] User #{} — payment notification for order #{}", event.getUserId(), event.getOrderId());

        // ADMIN notification
        Notification adminNotif = new Notification();
        adminNotif.setOrderId(event.getOrderId());
        adminNotif.setType("ADMIN");
        adminNotif.setCategory("PAYMENT");
        adminNotif.setStatus("SENT");
        adminNotif.setCreatedAt(LocalDateTime.now());
        adminNotif.setMessage("[ADMIN] Đơn hàng #" + event.getOrderId()
                + " đã thanh toán thành công. Doanh thu +" + event.getAmount() + " VND");
        adminNotif.setMetadata(Map.of("userId", event.getUserId(), "amount", event.getAmount()));
        notificationRepository.save(adminNotif);
        log.info("[NOTIFICATION] ADMIN — payment completed for order #{}, revenue +{}", event.getOrderId(), event.getAmount());

        return userNotif;
    }

    /** Tạo notification khi đặt hàng */
    public Notification createOrderNotification(OrderCreatedEvent event) {
        Notification notification = new Notification();
        notification.setUserId(event.getUserId());
        notification.setOrderId(event.getOrderId());
        notification.setType("USER");
        notification.setCategory("ORDER");
        notification.setStatus("ORDER_PLACED");
        notification.setCreatedAt(LocalDateTime.now());
        int itemCount = event.getItems() == null ? 0 : event.getItems().size();
        notification.setMessage("Đơn hàng #" + event.getOrderId()
                + " đặt thành công với " + itemCount + " sản phẩm, tổng: " + event.getTotal());
        log.info("[NOTIFICATION] Order #{} placed — userId={} total={}", event.getOrderId(), event.getUserId(), event.getTotal());
        return notificationRepository.save(notification);
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public List<Notification> getNotificationsByUser(Long userId) {
        return notificationRepository.findAllByUserId(userId);
    }

    public List<Notification> getAdminNotifications() {
        return notificationRepository.findAllByType("ADMIN");
    }

    public long countUnreadNotifications(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public Notification markAsRead(String notificationId, Long currentUserId) {
        return markAsRead(notificationId, currentUserId, false);
    }

    public Notification markAsRead(String notificationId, Long currentUserId, boolean isAdmin) {
        Notification existing = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        boolean isAdminNotification = "ADMIN".equals(existing.getType());
        boolean canReadAdminNotification = isAdmin && isAdminNotification;
        boolean ownsUserNotification = !isAdminNotification
                && currentUserId != null
                && currentUserId.equals(existing.getUserId());
        if (!canReadAdminNotification && !ownsUserNotification) {
            throw new IllegalArgumentException("Notification not found: " + notificationId);
        }
        Notification updated = copyOf(existing);
        updated.setRead(true);
        return notificationRepository.save(updated);
    }

    private Notification copyOf(Notification source) {
        Notification copy = new Notification();
        copy.setId(source.getId());
        copy.setUserId(source.getUserId());
        copy.setOrderId(source.getOrderId());
        copy.setPaymentId(source.getPaymentId());
        copy.setType(source.getType());
        copy.setCategory(source.getCategory());
        copy.setMessage(source.getMessage());
        copy.setStatus(source.getStatus());
        copy.setRead(source.isRead());
        copy.setCreatedAt(source.getCreatedAt());
        copy.setMetadata(source.getMetadata() == null ? null : Map.copyOf(source.getMetadata()));
        return copy;
    }
}
