package com.rainbowforest.recommendationservice.controller;

import com.rainbowforest.recommendationservice.model.SupportMessage;
import com.rainbowforest.recommendationservice.repository.SupportMessageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/support-chat")
public class SupportChatController {

    private final SupportMessageRepository messageRepository;

    public SupportChatController(SupportMessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @GetMapping("/history/{customerId}")
    public ResponseEntity<?> getHistory(
            @PathVariable String customerId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Roles", required = false) String roles,
            @RequestHeader(value = "X-Guest-Id", required = false) String guestId) {

        if (!canAccessCustomer(customerId, userId, roles, guestId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }

        List<SupportMessage> messages = messageRepository.findTop100ByCustomerIdOrderByCreatedAtAsc(customerId);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getSessions(
            @RequestHeader(value = "X-User-Roles", required = false) String roles) {
        if (!isAdmin(roles)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied");
        }
        return ResponseEntity.ok(messageRepository.findActiveCustomerIds());
    }

    private boolean canAccessCustomer(String customerId, String userId, String roles, String guestId) {
        return isAdmin(roles)
                || (userId != null && customerId.equals(userId))
                || (guestId != null && customerId.equals(guestId));
    }

    private boolean isAdmin(String roles) {
        return roles != null && roles.contains("ROLE_ADMIN");
    }
}
