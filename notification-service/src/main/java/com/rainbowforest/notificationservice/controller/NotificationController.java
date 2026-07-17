package com.rainbowforest.notificationservice.controller;

import com.rainbowforest.notificationservice.domain.Notification;
import com.rainbowforest.notificationservice.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getNotificationsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getNotificationsByUser(userId));
    }

    @GetMapping("/admin")
    public ResponseEntity<List<Notification>> getAdminNotifications() {
        return ResponseEntity.ok(notificationService.getAdminNotifications());
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @PathVariable Long userId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {
        Long currentUserId = parseUserId(userIdHeader);
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!currentUserId.equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(Map.of("count", notificationService.countUnreadNotifications(userId)));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable String notificationId,
            @RequestHeader(value = "X-User-Id", required = false) String userIdHeader,
            @RequestHeader(value = "X-User-Roles", required = false) String rolesHeader) {
        Long currentUserId = parseUserId(userIdHeader);
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(notificationService.markAsRead(
                notificationId,
                currentUserId,
                hasRole(rolesHeader, "ROLE_ADMIN")));
    }

    private boolean hasRole(String rolesHeader, String requiredRole) {
        if (rolesHeader == null || rolesHeader.isBlank()) {
            return false;
        }
        return java.util.Arrays.stream(rolesHeader.split(","))
                .map(String::trim)
                .anyMatch(requiredRole::equals);
    }

    private Long parseUserId(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
