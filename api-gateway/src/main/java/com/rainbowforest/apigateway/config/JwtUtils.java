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

    private final SecretKey signingKey;

    public JwtUtils(@Value("${security.jwt.secret:rainbowforest-local-development-secret-key-must-be-at-least-256-bits}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
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
