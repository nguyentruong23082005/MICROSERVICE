package com.rainbowforest.userservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FirebaseLoginRequest(
        @NotBlank(message = "Firebase ID token is required")
        @Size(max = 4096, message = "Firebase ID token is too large")
        String idToken) {
}
