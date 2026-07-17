package com.rainbowforest.apigateway.filter;

import com.rainbowforest.apigateway.config.JwtUtils;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Component
public class JwtAuthenticationFilter implements WebFilter {

    private static final String ACCESS_COOKIE = "rf_access";
    private static final String REFRESH_COOKIE = "rf_refresh";
    private static final String CSRF_COOKIE = "XSRF-TOKEN";
    private static final String ADMIN_ACCESS_COOKIE = "rf_admin_access";
    private static final String ADMIN_REFRESH_COOKIE = "rf_admin_refresh";
    private static final String ADMIN_CSRF_COOKIE = "XSRF-ADMIN-TOKEN";
    private static final String CSRF_HEADER = "X-XSRF-TOKEN";
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");
    private static final List<String> PUBLIC_CHAT_PATH_PREFIXES = List.of(
            "/api/chat",
            "/api/chatbot",
            "/api/support-chat",
            "/ws/support-chat"
    );

    private final JwtUtils jwtUtils;
    private final ReactiveRedisTemplate<String, String> redisTemplate;

    public JwtAuthenticationFilter(
            JwtUtils jwtUtils,
            @Qualifier("reactiveStringRedisTemplate") ReactiveRedisTemplate<String, String> redisTemplate) {
        this.jwtUtils = jwtUtils;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (!hasValidCsrfToken(exchange)) {
            exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
            return exchange.getResponse().setComplete();
        }

        ServerHttpRequest sanitizedRequest = exchange.getRequest().mutate()
                .headers(headers -> {
                    headers.remove("X-User-Id");
                    headers.remove("X-User-Roles");
                    if (!isPublicGuestChatPath(exchange.getRequest().getURI().getPath())) {
                        headers.remove("X-Guest-Id");
                    }
                })
                .build();
        ServerWebExchange sanitizedExchange = exchange.mutate().request(sanitizedRequest).build();

        String token = resolveToken(sanitizedExchange);
        if (token == null) {
            return chain.filter(sanitizedExchange);
        }

        return redisTemplate.hasKey("blacklist:" + token)
                .flatMap(isBlacklisted -> {
                    if (Boolean.TRUE.equals(isBlacklisted)) {
                        sanitizedExchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                        return sanitizedExchange.getResponse().setComplete();
                    }

                    if (!jwtUtils.validateToken(token)) {
                        sanitizedExchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                        return sanitizedExchange.getResponse().setComplete();
                    }

                    String userId = jwtUtils.getUserId(token);
                    String roles = jwtUtils.getRoles(token);
                    List<SimpleGrantedAuthority> authorities = Arrays.stream(roles.split(","))
                            .map(String::trim)
                            .filter(role -> !role.isBlank())
                            .map(SimpleGrantedAuthority::new)
                            .toList();

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userId, token, authorities);

                    ServerHttpRequest mutatedRequest = sanitizedExchange.getRequest().mutate()
                            .headers(headers -> {
                                headers.setBearerAuth(token);
                                headers.set("X-User-Id", userId);
                                headers.set("X-User-Roles", roles);
                            })
                            .build();

                    return chain.filter(sanitizedExchange.mutate().request(mutatedRequest).build())
                            .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));
                });
    }

    private String resolveToken(ServerWebExchange exchange) {
        String authorization = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String bearerToken = authorization.substring(7);
            if (!bearerToken.isBlank()) {
                return bearerToken;
            }
        }

        HttpCookie accessCookie = exchange.getRequest().getCookies().getFirst(
                isAdminPath(exchange) ? ADMIN_ACCESS_COOKIE : ACCESS_COOKIE);
        if (accessCookie == null || accessCookie.getValue().isBlank()) {
            return null;
        }
        return accessCookie.getValue();
    }

    private boolean hasValidCsrfToken(ServerWebExchange exchange) {
        String path = exchange.getRequest().getURI().getPath();
        if (path.startsWith("/api/accounts/auth/") || isPublicChatPath(path)) {
            return true;
        }

        String method = exchange.getRequest().getMethod().name();
        if (SAFE_METHODS.contains(method) || !hasCredentialCookie(exchange)) {
            return true;
        }

        String csrfCookieName = isAdminPath(exchange) ? ADMIN_CSRF_COOKIE : CSRF_COOKIE;
        HttpCookie csrfCookie = exchange.getRequest().getCookies().getFirst(csrfCookieName);
        String csrfHeader = exchange.getRequest().getHeaders().getFirst(CSRF_HEADER);
        if (csrfCookie == null || csrfCookie.getValue().isBlank() || csrfHeader == null || csrfHeader.isBlank()) {
            return false;
        }

        return MessageDigest.isEqual(
                csrfCookie.getValue().getBytes(StandardCharsets.UTF_8),
                csrfHeader.getBytes(StandardCharsets.UTF_8));
    }

    private boolean hasCredentialCookie(ServerWebExchange exchange) {
        if (isAdminPath(exchange)) {
            return exchange.getRequest().getCookies().containsKey(ADMIN_ACCESS_COOKIE)
                    || exchange.getRequest().getCookies().containsKey(ADMIN_REFRESH_COOKIE);
        }
        return exchange.getRequest().getCookies().containsKey(ACCESS_COOKIE)
                || exchange.getRequest().getCookies().containsKey(REFRESH_COOKIE);
    }

    private boolean isPublicGuestChatPath(String path) {
        return path.equals("/api/support-chat")
                || path.startsWith("/api/support-chat/")
                || path.equals("/ws/support-chat")
                || path.startsWith("/ws/support-chat/");
    }

    private boolean isPublicChatPath(String path) {
        return PUBLIC_CHAT_PATH_PREFIXES.stream().anyMatch(prefix -> path.equals(prefix) || path.startsWith(prefix + "/"));
    }

    private boolean isAdminPath(ServerWebExchange exchange) {
        String requestedScope = exchange.getRequest().getHeaders().getFirst("X-Auth-Scope");
        if ("admin".equalsIgnoreCase(requestedScope)) {
            return true;
        }
        String queryScope = exchange.getRequest().getQueryParams().getFirst("authScope");
        if ("admin".equalsIgnoreCase(queryScope)) {
            return true;
        }
        String path = exchange.getRequest().getURI().getPath();
        return Arrays.stream(path.split("/"))
                .anyMatch("admin"::equals);
    }
}
