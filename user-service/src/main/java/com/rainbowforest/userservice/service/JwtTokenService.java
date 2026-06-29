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

    private final SecretKey signingKey;
    private final long expirationMillis;
    private final StringRedisTemplate redisTemplate;

    public JwtTokenService(
            @Value("${security.jwt.secret:rainbowforest-local-development-secret-key-must-be-at-least-256-bits}") String secret,
            @Value("${security.jwt.expiration-ms:86400000}") long expirationMillis,
            StringRedisTemplate redisTemplate) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMillis = expirationMillis;
        this.redisTemplate = redisTemplate;
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
        String uuid = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set("refresh:" + userId, uuid, 7, TimeUnit.DAYS);
        return uuid;
    }

    public boolean validateRefreshToken(Long userId, String token) {
        String storedToken = redisTemplate.opsForValue().get("refresh:" + userId);
        return token != null && token.equals(storedToken);
    }

    public void deleteRefreshToken(Long userId) {
        redisTemplate.delete("refresh:" + userId);
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
