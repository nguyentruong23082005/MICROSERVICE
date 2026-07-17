package com.rainbowforest.userservice.controller;

import com.rainbowforest.userservice.dto.FirebaseLoginRequest;
import com.rainbowforest.userservice.dto.ForgotPasswordRequest;
import com.rainbowforest.userservice.dto.LoginRequest;
import com.rainbowforest.userservice.dto.LoginResponse;
import com.rainbowforest.userservice.dto.ResetPasswordRequest;
import com.rainbowforest.userservice.exception.FirebaseTokenVerificationException;
import com.rainbowforest.userservice.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private static final String AUTH_SCOPE_HEADER = "X-Auth-Scope";
    private static final String ADMIN_SCOPE = "admin";
    private static final String ADMIN_ROLE = "ROLE_ADMIN";
    private static final String ACCESS_COOKIE = "rf_access";
    private static final String REFRESH_COOKIE = "rf_refresh";
    private static final String CSRF_COOKIE = "XSRF-TOKEN";
    private static final String ADMIN_ACCESS_COOKIE = "rf_admin_access";
    private static final String ADMIN_REFRESH_COOKIE = "rf_admin_refresh";
    private static final String ADMIN_CSRF_COOKIE = "XSRF-ADMIN-TOKEN";
    private static final Duration ACCESS_MAX_AGE = Duration.ofDays(1);
    private static final Duration REFRESH_MAX_AGE = Duration.ofDays(7);

    private final AuthService authService;
    private final boolean cookieSecure;

    public AuthController(
            AuthService authService,
            @Value("${security.auth.cookie-secure:true}") boolean cookieSecure) {
        this.authService = authService;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest loginRequest,
            @RequestHeader(value = AUTH_SCOPE_HEADER, required = false) String requestedScope) {
        log.info("[user-service] POST /auth/login username={}", loginRequest.getUserName());
        try {
            LoginResponse response = authService.login(loginRequest);
            boolean adminScope = isAdminScope(requestedScope);
            if (adminScope && !ADMIN_ROLE.equals(response.getRole())) {
                authService.logout(response.getToken(), response.getRefreshToken());
                log.warn("[user-service] Admin login forbidden username={}", loginRequest.getUserName());
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
            log.info("[user-service] Login successful username={}", loginRequest.getUserName());
            return responseWithAuthCookies(response, adminScope);
        } catch (IllegalArgumentException exception) {
            log.warn("[user-service] Login BadRequest: {}", exception.getMessage());
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (SecurityException exception) {
            log.warn("[user-service] Login Unauthorized: {}", exception.getMessage());
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/firebase-login")
    public ResponseEntity<LoginResponse> firebaseLogin(@Valid @RequestBody FirebaseLoginRequest request) {
        String correlationId = UUID.randomUUID().toString();
        try {
            return responseWithAuthCookies(authService.loginWithFirebase(request.idToken()), false);
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (FirebaseTokenVerificationException exception) {
            if (exception.isUpstreamUnavailable()) {
                log.error("[user-service] Firebase login unavailable category={} correlationId={}",
                        exception.getCategory(), correlationId);
                return new ResponseEntity<>(HttpStatus.SERVICE_UNAVAILABLE);
            }
            log.warn("[user-service] Firebase login rejected category={} correlationId={}",
                    exception.getCategory(), correlationId);
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        } catch (SecurityException exception) {
            log.warn("[user-service] Firebase account rejected correlationId={}", correlationId);
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        } catch (IllegalStateException exception) {
            log.error("[user-service] Firebase login unavailable correlationId={}", correlationId);
            return new ResponseEntity<>(HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.requestPasswordReset(request.email());
        } catch (RuntimeException exception) {
            log.error("[user-service] Password reset notification failed", exception);
        }
        // Always return the same response to prevent account enumeration.
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.token(), request.newPassword());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException exception) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (SecurityException exception) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @RequestHeader(value = AUTH_SCOPE_HEADER, required = false) String requestedScope,
            @CookieValue(value = REFRESH_COOKIE, required = false) String customerRefreshToken,
            @CookieValue(value = ADMIN_REFRESH_COOKIE, required = false) String adminRefreshToken) {
        boolean adminScope = isAdminScope(requestedScope);
        String refreshToken = adminScope ? adminRefreshToken : customerRefreshToken;
        if (refreshToken == null || refreshToken.isBlank()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        try {
            LoginResponse response = authService.refresh(refreshToken);
            if (adminScope && !ADMIN_ROLE.equals(response.getRole())) {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
            return responseWithAuthCookies(response, adminScope);
        } catch (SecurityException exception) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = AUTH_SCOPE_HEADER, required = false) String requestedScope,
            @CookieValue(value = ACCESS_COOKIE, required = false) String customerAccessToken,
            @CookieValue(value = REFRESH_COOKIE, required = false) String customerRefreshToken,
            @CookieValue(value = ADMIN_ACCESS_COOKIE, required = false) String adminAccessToken,
            @CookieValue(value = ADMIN_REFRESH_COOKIE, required = false) String adminRefreshToken) {
        boolean adminScope = isAdminScope(requestedScope);
        CookieNames cookies = cookieNames(adminScope);
        authService.logout(
                adminScope ? adminAccessToken : customerAccessToken,
                adminScope ? adminRefreshToken : customerRefreshToken);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, expiredCookie(cookies.access(), "/", true).toString())
                .header(HttpHeaders.SET_COOKIE, expiredCookie(cookies.refresh(), "/api/accounts/auth", true).toString())
                .header(HttpHeaders.SET_COOKIE, expiredCookie(cookies.csrf(), "/", false).toString())
                .build();
    }

    private ResponseEntity<LoginResponse> responseWithAuthCookies(LoginResponse response, boolean adminScope) {
        CookieNames cookies = cookieNames(adminScope);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookie(cookies.access(), response.getToken(), "/", ACCESS_MAX_AGE, true).toString())
                .header(HttpHeaders.SET_COOKIE, authCookie(cookies.refresh(), response.getRefreshToken(), "/api/accounts/auth", REFRESH_MAX_AGE, true).toString())
                .header(HttpHeaders.SET_COOKIE, authCookie(cookies.csrf(), UUID.randomUUID().toString(), "/", REFRESH_MAX_AGE, false).toString())
                .body(response);
    }

    private boolean isAdminScope(String requestedScope) {
        return ADMIN_SCOPE.equalsIgnoreCase(requestedScope);
    }

    private CookieNames cookieNames(boolean adminScope) {
        return adminScope
                ? new CookieNames(ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE, ADMIN_CSRF_COOKIE)
                : new CookieNames(ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE);
    }

    private ResponseCookie authCookie(
            String name,
            String value,
            String path,
            Duration maxAge,
            boolean httpOnly) {
        return ResponseCookie.from(name, value)
                .httpOnly(httpOnly)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path(path)
                .maxAge(maxAge)
                .build();
    }

    private ResponseCookie expiredCookie(String name, String path, boolean httpOnly) {
        return authCookie(name, "", path, Duration.ZERO, httpOnly);
    }

    private record CookieNames(String access, String refresh, String csrf) {
    }
}
