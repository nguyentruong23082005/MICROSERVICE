package com.rainbowforest.apigateway.config;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtils {

    private static final int MINIMUM_SECRET_BYTES = 32;
    private static final String EXPOSED_PLACEHOLDER =
            "rainbowforest-local-development-secret-key-must-be-at-least-256-bits";

    private final SecretKey signingKey;

    public JwtUtils(@Value("${security.jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(validateSecret(secret));
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

    public boolean validateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            Date expiration = claims.getExpiration();
            return expiration == null || expiration.after(new Date());
        } catch (Exception ex) {
            return false;
        }
    }

    public String getUserId(String token) {
        Claims claims = parseClaims(token);
        Object userId = claims.get("userId");
        return userId == null ? claims.getSubject() : String.valueOf(userId);
    }

    public String getRoles(String token) {
        Object roles = parseClaims(token).get("roles");
        return roles == null ? "" : String.valueOf(roles);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
