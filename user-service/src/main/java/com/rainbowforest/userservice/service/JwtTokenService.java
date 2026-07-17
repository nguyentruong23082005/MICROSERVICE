package com.rainbowforest.userservice.service;

import com.rainbowforest.userservice.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class JwtTokenService {

    private static final int MINIMUM_SECRET_BYTES = 32;
    private static final String REFRESH_BY_USER_PREFIX = "refresh:";
    private static final String USER_BY_REFRESH_PREFIX = "refresh-user:";
    private static final long REFRESH_TTL_DAYS = 7;
    private static final String EXPOSED_PLACEHOLDER =
            "rainbowforest-local-development-secret-key-must-be-at-least-256-bits";

    private final SecretKey signingKey;
    private final long expirationMillis;
    private final StringRedisTemplate redisTemplate;

    public JwtTokenService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.expiration-ms:86400000}") long expirationMillis,
            StringRedisTemplate redisTemplate) {
        this.signingKey = Keys.hmacShaKeyFor(validateSecret(secret));
        this.expirationMillis = expirationMillis;
        this.redisTemplate = redisTemplate;
    }

    private static byte[] validateSecret(String secret) {
        if (secret == null || secret.isBlank() || EXPOSED_PLACEHOLDER.equals(secret)) {
            throw new IllegalArgumentException("JWT secret must be configured with a non-placeholder value");
        }

        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MINIMUM_SECRET_BYTES) {
            throw new IllegalArgumentException("JWT secret must contain at least 32 UTF-8 bytes");
        }
        return secretBytes;
    }

    public String generateToken(User user) {
        String roleName = user.getRole() == null ? "ROLE_USER" : user.getRole().getRoleName();
        Instant now = Instant.now();

        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("userId", user.getId())
                .claim("userName", user.getUserName())
                .claim("roles", roleName)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMillis)))
                .signWith(signingKey)
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        String previousToken = redisTemplate.opsForValue().get(REFRESH_BY_USER_PREFIX + userId);
        if (previousToken != null) {
            redisTemplate.delete(USER_BY_REFRESH_PREFIX + previousToken);
        }

        String token = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(
                REFRESH_BY_USER_PREFIX + userId, token, REFRESH_TTL_DAYS, TimeUnit.DAYS);
        redisTemplate.opsForValue().set(
                USER_BY_REFRESH_PREFIX + token, String.valueOf(userId), REFRESH_TTL_DAYS, TimeUnit.DAYS);
        return token;
    }

    public Long getUserIdForRefreshToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        String userId = redisTemplate.opsForValue().get(USER_BY_REFRESH_PREFIX + token);
        if (userId == null) {
            return null;
        }
        try {
            Long parsedUserId = Long.valueOf(userId);
            return validateRefreshToken(parsedUserId, token) ? parsedUserId : null;
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    public boolean validateRefreshToken(Long userId, String token) {
        String storedToken = redisTemplate.opsForValue().get(REFRESH_BY_USER_PREFIX + userId);
        return token != null && token.equals(storedToken);
    }

    public void deleteRefreshToken(String token) {
        Long userId = getUserIdForRefreshToken(token);
        if (userId != null) {
            redisTemplate.delete(REFRESH_BY_USER_PREFIX + userId);
        }
        if (token != null && !token.isBlank()) {
            redisTemplate.delete(USER_BY_REFRESH_PREFIX + token);
        }
    }

    public Claims parseAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isAccessTokenBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + token));
    }

    public void blacklistAccessToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            
            Date expiration = claims.getExpiration();
            if (expiration != null) {
                long remainingTtl = expiration.getTime() - System.currentTimeMillis();
                if (remainingTtl > 0) {
                    redisTemplate.opsForValue().set("blacklist:" + token, "true", remainingTtl, TimeUnit.MILLISECONDS);
                }
            }
        } catch (Exception e) {
            // Fallback to 24 hours if token is already expired or unparseable
            redisTemplate.opsForValue().set("blacklist:" + token, "true", 24, TimeUnit.HOURS);
        }
    }
}
