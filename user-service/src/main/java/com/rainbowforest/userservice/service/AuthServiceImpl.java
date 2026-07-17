package com.rainbowforest.userservice.service;

import com.rainbowforest.userservice.client.NotificationClient;
import com.rainbowforest.userservice.dto.LoginRequest;
import com.rainbowforest.userservice.dto.LoginResponse;
import com.rainbowforest.userservice.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

@Service
public class AuthServiceImpl implements AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(30);
    private static final String RESET_KEY_PREFIX = "auth:password-reset:";

    private final UserService userService;
    private final JwtTokenService jwtTokenService;
    private final PasswordEncoder passwordEncoder;
    private final FirebaseIdentityService firebaseIdentityService;
    private final StringRedisTemplate redisTemplate;
    private final NotificationClient notificationClient;
    private final String frontendBaseUrl;

    public AuthServiceImpl(
            UserService userService,
            JwtTokenService jwtTokenService,
            PasswordEncoder passwordEncoder,
            FirebaseIdentityService firebaseIdentityService,
            StringRedisTemplate redisTemplate,
            NotificationClient notificationClient,
            @Value("${app.frontend.base-url:http://localhost:5173}") String frontendBaseUrl) {
        this.userService = userService;
        this.jwtTokenService = jwtTokenService;
        this.passwordEncoder = passwordEncoder;
        this.firebaseIdentityService = firebaseIdentityService;
        this.redisTemplate = redisTemplate;
        this.notificationClient = notificationClient;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        if (loginRequest == null || loginRequest.getIdentifier() == null || loginRequest.getPassword() == null) {
            throw new IllegalArgumentException("Username or email and password are required");
        }
        String identifier = loginRequest.getIdentifier().trim();
        User user = userService.getUserByLoginIdentifier(identifier);
        if (user == null || user.getActive() != 1
                || !passwordEncoder.matches(loginRequest.getPassword(), user.getUserPassword())) {
            throw new SecurityException("Invalid credentials");
        }
        return createLoginResponse(user);
    }

    @Override
    public LoginResponse loginWithFirebase(String idToken) {
        FirebaseIdentity identity = firebaseIdentityService.verify(idToken);
        User user = userService.getUserByLoginIdentifier(identity.email());
        if (user == null) {
            user = userService.createFirebaseUser(identity.email(), identity.displayName(), identity.uid());
        }
        if (user.getActive() != 1) {
            throw new SecurityException("User is not active");
        }
        return createLoginResponse(user);
    }

    @Override
    public LoginResponse refresh(String refreshToken) {
        Long userId = jwtTokenService.getUserIdForRefreshToken(refreshToken);
        if (userId == null) {
            throw new SecurityException("Invalid refresh token");
        }
        User user = userService.getUserById(userId);
        if (user == null || user.getActive() != 1) {
            throw new SecurityException("User is not active");
        }
        return createLoginResponse(user);
    }

    @Override
    public void logout(String accessToken, String refreshToken) {
        if (accessToken != null && !accessToken.isBlank()) {
            jwtTokenService.blacklistAccessToken(accessToken);
        }
        jwtTokenService.deleteRefreshToken(refreshToken);
    }

    @Override
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        User user = userService.getUserByLoginIdentifier(email.trim().toLowerCase(Locale.ROOT));
        if (user == null || user.getActive() != 1 || user.getUserDetails() == null) {
            return;
        }
        String rawToken = randomToken();
        redisTemplate.opsForValue().set(RESET_KEY_PREFIX + sha256(rawToken), String.valueOf(user.getId()), RESET_TOKEN_TTL);
        String displayName = user.getUserDetails().getFirstName() + " " + user.getUserDetails().getLastName();
        notificationClient.sendPasswordResetEmail(new NotificationClient.PasswordResetEmailRequest(
                user.getUserDetails().getEmail(), displayName.trim(),
                frontendBaseUrl + "/reset-password?token=" + rawToken));
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Reset token is required");
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters");
        }
        String key = RESET_KEY_PREFIX + sha256(token);
        String userId = redisTemplate.opsForValue().getAndDelete(key);
        if (userId == null) {
            throw new SecurityException("Reset token is invalid or expired");
        }
        userService.updatePassword(Long.valueOf(userId), newPassword);
    }

    private LoginResponse createLoginResponse(User user) {
        String roleName = user.getRole() == null ? "ROLE_USER" : user.getRole().getRoleName();
        String token = jwtTokenService.generateToken(user);
        String refreshToken = jwtTokenService.generateRefreshToken(user.getId());
        return new LoginResponse(token, refreshToken, user.getId(), user.getUserName(), roleName);
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}

