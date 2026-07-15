package com.rainbowforest.userservice.controller;

import com.rainbowforest.userservice.dto.LoginRequest;
import com.rainbowforest.userservice.dto.LoginResponse;
import com.rainbowforest.userservice.dto.RefreshRequest;
import com.rainbowforest.userservice.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        log.info("[user-service] POST /auth/login username={}", loginRequest.getUserName());
        try {
            LoginResponse response = authService.login(loginRequest);
            log.info("[user-service] Login successful username={}", loginRequest.getUserName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException exception) {
            log.warn("[user-service] Login BadRequest: {}", exception.getMessage());
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (SecurityException exception) {
            log.warn("[user-service] Login Unauthorized: {}", exception.getMessage());
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody RefreshRequest refreshRequest) {
        try {
            return ResponseEntity.ok(authService.refresh(refreshRequest));
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (SecurityException exception) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("userId") Long userId) {
        log.info("[user-service] POST /auth/logout userId={}", userId);
        authService.logout(authHeader, userId);
        return ResponseEntity.ok().build();
    }
}
