package com.rainbowforest.userservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.rainbowforest.userservice.entity.User;
import com.rainbowforest.userservice.entity.UserDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Locale;

public record RegistrationRequest(
        @NotBlank(message = "Username is required")
        @Size(max = 50, message = "Username must not exceed 50 characters")
        String userName,

        @NotBlank(message = "Password is required")
        @Size(max = 255, message = "Password must not exceed 255 characters")
        @JsonAlias("password")
        String userPassword,

        @NotBlank(message = "Email is required")
        @jakarta.validation.constraints.Pattern(
                regexp = "^\\s*[^\\s@]+@[^\\s@]+\\.[^\\s@]+\\s*$",
                message = "Email must be valid")
        @Size(max = 50, message = "Email must not exceed 50 characters")
        String email,

        @Valid
        UserDetailsRequest userDetails) {

    public User toEntity() {
        User user = new User();
        user.setUserName(userName);
        user.setUserPassword(userPassword);
        user.setUserDetails(resolveDetails());
        return user;
    }

    private UserDetails resolveDetails() {
        UserDetails details = userDetails == null ? new UserDetails() : userDetails.toEntity();
        if (userDetails == null) {
            details.setFirstName(userName);
            details.setLastName(userName);
        }
        details.setEmail(normalizeEmail(email));
        return details;
    }

    private String normalizeEmail(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
