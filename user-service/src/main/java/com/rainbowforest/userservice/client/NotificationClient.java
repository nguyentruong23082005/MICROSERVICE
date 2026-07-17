package com.rainbowforest.userservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service")
public interface NotificationClient {

    @PostMapping("/notifications/email/password-reset")
    void sendPasswordResetEmail(@RequestBody PasswordResetEmailRequest request);

    record PasswordResetEmailRequest(String email, String displayName, String resetUrl) {
    }
}
