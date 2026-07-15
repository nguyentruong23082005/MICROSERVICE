package com.rainbowforest.apigateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import reactor.core.publisher.Mono;

/**
 * Rate Limiting Configuration using Redis Token Bucket algorithm.
 *
 * Global policy  : 100 requests / minute per IP
 * Sensitive paths: 20 requests / minute (login, checkout) — configured per-route in application.yml
 *
 * KeyResolver priority:
 *   1. Authenticated users  → keyed by userId  (X-User-Id header from JWT filter)
 *   2. Anonymous requests   → keyed by client IP
 */
@Configuration
public class RateLimitConfig {

    /**
     * Global KeyResolver: prefer authenticated userId, fall back to IP.
     * This bean is @Primary so Spring Gateway picks it as the default resolver.
     */
    @Bean
    @Primary
    public KeyResolver globalKeyResolver() {
        return exchange -> {
            // If JWT filter has set X-User-Id, use it for per-user bucketing
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId != null && !userId.isBlank()) {
                return Mono.just("user:" + userId);
            }
            // Fall back to remote IP address
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            return Mono.just("ip:" + ip);
        };
    }

    /**
     * Sensitive-path KeyResolver (login, checkout): keyed by IP only.
     * Prevents credential stuffing regardless of whether a token is present.
     */
    @Bean
    public KeyResolver sensitiveKeyResolver() {
        return exchange -> {
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            return Mono.just("sensitive:" + ip);
        };
    }

    /**
     * Global rate limiter: 100 requests/min.
     * replenishRate = tokens added per second  (100 / 60 ≈ 2)
     * burstCapacity  = max tokens in bucket    (100 — allows a short burst)
     */
    @Bean
    @Primary
    public RedisRateLimiter globalRedisRateLimiter() {
        return new RedisRateLimiter(2, 100, 1);
    }

    /**
     * Sensitive rate limiter: 20 requests/min.
     * replenishRate ≈ 1 token/3 s, burst = 20
     */
    @Bean
    public RedisRateLimiter sensitiveRedisRateLimiter() {
        return new RedisRateLimiter(1, 20, 1);
    }
}
