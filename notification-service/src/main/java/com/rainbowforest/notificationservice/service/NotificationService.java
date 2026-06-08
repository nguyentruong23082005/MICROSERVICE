package com.rainbowforest.notificationservice.service;

import com.rainbowforest.notificationservice.domain.Notification;
import com.rainbowforest.notificationservice.event.PaymentCompletedEvent;
import com.rainbowforest.notificationservice.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification createPaymentNotification(PaymentCompletedEvent event) {
        Notification notification = new Notification();
        notification.setUserId(event.getUserId());
        notification.setOrderId(event.getOrderId());
        notification.setPaymentId(event.getPaymentId());
        notification.setStatus("SENT");
        notification.setCreatedAt(LocalDateTime.now());
        notification.setMessage("Payment completed for order #" + event.getOrderId() + " with amount " + event.getAmount());
        return notificationRepository.save(notification);
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public List<Notification> getNotificationsByUser(Long userId) {
        return notificationRepository.findAllByUserId(userId);
    }
}
