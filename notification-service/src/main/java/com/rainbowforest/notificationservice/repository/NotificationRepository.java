package com.rainbowforest.notificationservice.repository;

import com.rainbowforest.notificationservice.domain.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findAllByUserId(Long userId);

    List<Notification> findAllByType(String type);

    List<Notification> findAllByOrderId(Long orderId);

    long countByUserIdAndReadFalse(Long userId);
}
