package com.rainbowforest.apigateway.config;

import com.rainbowforest.apigateway.filter.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class WebSecurityConfigTest {

    @Test
    void corsConfiguration_should_use_only_configured_origin_patterns() {
        WebSecurityConfig config = new WebSecurityConfig(List.of(
                "https://shop.example.com",
                "https://admin.example.com"));
        UrlBasedCorsConfigurationSource source = config.corsConfigurationSource();

        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.options("/api/catalog/products")
                        .header(HttpHeaders.ORIGIN, "https://shop.example.com")
                        .build());

        CorsConfiguration cors = source.getCorsConfiguration(exchange);

        assertNotNull(cors);
        assertEquals("https://shop.example.com", cors.checkOrigin("https://shop.example.com"));
        assertEquals("https://admin.example.com", cors.checkOrigin("https://admin.example.com"));
        assertEquals(null, cors.checkOrigin("http://localhost:5175"));
    }

    @Test
    void public_routes_should_include_review_chatbot_and_support_chat_paths() {
        assertTrue(WebSecurityConfig.publicGetPaths().contains("/api/review/recommendations"));
        assertTrue(WebSecurityConfig.publicGetPaths().contains("/api/review/recommendations/**"));
        assertTrue(WebSecurityConfig.publicApiPaths().contains("/api/chatbot/send"));
        assertTrue(WebSecurityConfig.publicApiPaths().contains("/api/chatbot/**"));
        assertTrue(WebSecurityConfig.publicApiPaths().contains("/api/support-chat/**"));
    }

    @Test
    void public_websocket_paths_should_include_support_chat_handshake_route() {
        assertTrue(WebSecurityConfig.publicWebSocketPaths().contains("/ws/support-chat"));
        assertTrue(WebSecurityConfig.publicWebSocketPaths().contains("/ws/support-chat/**"));
    }

    @Test
    void adminPaths_should_include_management_routes_without_blocking_customer_payment_creation() {
        assertTrue(WebSecurityConfig.adminPaths().contains("/api/accounts/admin/**"));
        assertTrue(WebSecurityConfig.adminPaths().contains("/api/shop/orders"));
        assertTrue(WebSecurityConfig.adminPaths().contains("/api/shop/order/*/status"));
        assertTrue(WebSecurityConfig.adminPaths().contains("/api/notifications/admin"));
        assertTrue(WebSecurityConfig.adminPaymentPaths().contains("/api/payments"));
        assertTrue(WebSecurityConfig.adminPaymentPaths().contains("/api/payments/revenue"));
        assertTrue(!WebSecurityConfig.adminPaths().contains("/api/payments/**"));
        assertTrue(!WebSecurityConfig.adminPaymentPaths().contains("/api/payments/vnpay/create"));
        assertTrue(!WebSecurityConfig.adminPaymentPaths().contains("/api/payments/momo/create"));
    }

    @Test
    void jwt_utils_should_reject_missing_weak_and_exposed_secrets() {
        String exposedPlaceholder =
                "rainbowforest-local-development-secret-key-must-be-at-least-256-bits";

        assertThrows(IllegalArgumentException.class, () -> new JwtUtils(null));
        assertThrows(IllegalArgumentException.class, () -> new JwtUtils("   "));
        assertThrows(IllegalArgumentException.class, () -> new JwtUtils("short-secret"));
        assertThrows(IllegalArgumentException.class, () -> new JwtUtils(exposedPlaceholder));
    }

    @Test
    void jwt_utils_should_accept_a_secret_with_at_least_256_bits() {
        assertDoesNotThrow(() -> new JwtUtils("5f8c2d7a1b9e4f6c8d0a3b7e9f1c5d2a"));
    }

    @Test
    void jwtFilterAuthenticatesAccessCookieAndAddsInternalBearerHeader() {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        @SuppressWarnings("unchecked")
        ReactiveRedisTemplate<String, String> redisTemplate = mock(ReactiveRedisTemplate.class);
        when(redisTemplate.hasKey("blacklist:access-token")).thenReturn(Mono.just(false));
        when(jwtUtils.validateToken("access-token")).thenReturn(true);
        when(jwtUtils.getUserId("access-token")).thenReturn("42");
        when(jwtUtils.getRoles("access-token")).thenReturn("ROLE_USER");

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtUtils, redisTemplate);
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/accounts/users/42")
                        .cookie(new HttpCookie("rf_access", "access-token"))
                        .build());
        AtomicReference<String> downstreamAuthorization = new AtomicReference<>();

        filter.filter(exchange, filteredExchange -> {
            downstreamAuthorization.set(filteredExchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION));
            return Mono.empty();
        }).block();

        assertEquals("Bearer access-token", downstreamAuthorization.get());
    }

    @Test
    void jwtFilterRejectsCookieAuthenticatedMutationWithoutCsrfHeader() {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        @SuppressWarnings("unchecked")
        ReactiveRedisTemplate<String, String> redisTemplate = mock(ReactiveRedisTemplate.class);
        when(redisTemplate.hasKey("blacklist:access-token")).thenReturn(Mono.just(false));
        when(jwtUtils.validateToken("access-token")).thenReturn(true);
        when(jwtUtils.getUserId("access-token")).thenReturn("42");
        when(jwtUtils.getRoles("access-token")).thenReturn("ROLE_USER");
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtUtils, redisTemplate);
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/shop/orders")
                        .cookie(new HttpCookie("rf_access", "access-token"))
                        .cookie(new HttpCookie("XSRF-TOKEN", "csrf-token"))
                        .build());

        filter.filter(exchange, ignored -> Mono.error(new AssertionError("Request must not reach downstream"))).block();

        assertEquals(HttpStatus.FORBIDDEN, exchange.getResponse().getStatusCode());
    }

    @Test
    void jwtFilterUsesAdminCookieForAdminPathWhenBothSessionsExist() {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        @SuppressWarnings("unchecked")
        ReactiveRedisTemplate<String, String> redisTemplate = mock(ReactiveRedisTemplate.class);
        when(redisTemplate.hasKey("blacklist:admin-token")).thenReturn(Mono.just(false));
        when(jwtUtils.validateToken("admin-token")).thenReturn(true);
        when(jwtUtils.getUserId("admin-token")).thenReturn("7");
        when(jwtUtils.getRoles("admin-token")).thenReturn("ROLE_ADMIN");

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtUtils, redisTemplate);
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/shop/orders")
                        .header("X-Auth-Scope", "admin")
                        .cookie(new HttpCookie("rf_access", "customer-token"))
                        .cookie(new HttpCookie("rf_admin_access", "admin-token"))
                        .build());
        AtomicReference<String> downstreamAuthorization = new AtomicReference<>();

        filter.filter(exchange, filteredExchange -> {
            downstreamAuthorization.set(filteredExchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION));
            return Mono.empty();
        }).block();

        assertEquals("Bearer admin-token", downstreamAuthorization.get());
    }

    @Test
    void jwtFilterUsesCustomerCookieForCustomerPathWhenBothSessionsExist() {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        @SuppressWarnings("unchecked")
        ReactiveRedisTemplate<String, String> redisTemplate = mock(ReactiveRedisTemplate.class);
        when(redisTemplate.hasKey("blacklist:customer-token")).thenReturn(Mono.just(false));
        when(jwtUtils.validateToken("customer-token")).thenReturn(true);
        when(jwtUtils.getUserId("customer-token")).thenReturn("42");
        when(jwtUtils.getRoles("customer-token")).thenReturn("ROLE_USER");

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtUtils, redisTemplate);
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/shop/orders/me")
                        .cookie(new HttpCookie("rf_access", "customer-token"))
                        .cookie(new HttpCookie("rf_admin_access", "admin-token"))
                        .build());
        AtomicReference<String> downstreamAuthorization = new AtomicReference<>();

        filter.filter(exchange, filteredExchange -> {
            downstreamAuthorization.set(filteredExchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION));
            return Mono.empty();
        }).block();

        assertEquals("Bearer customer-token", downstreamAuthorization.get());
    }

    @Test
    void jwtFilterAcceptsAdminMutationWithAdminCsrfPair() {
        JwtUtils jwtUtils = mock(JwtUtils.class);
        @SuppressWarnings("unchecked")
        ReactiveRedisTemplate<String, String> redisTemplate = mock(ReactiveRedisTemplate.class);
        when(redisTemplate.hasKey("blacklist:admin-token")).thenReturn(Mono.just(false));
        when(jwtUtils.validateToken("admin-token")).thenReturn(true);
        when(jwtUtils.getUserId("admin-token")).thenReturn("7");
        when(jwtUtils.getRoles("admin-token")).thenReturn("ROLE_ADMIN");

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtUtils, redisTemplate);
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/shop/admin/orders")
                        .cookie(new HttpCookie("rf_access", "customer-token"))
                        .cookie(new HttpCookie("XSRF-TOKEN", "customer-csrf"))
                        .cookie(new HttpCookie("rf_admin_access", "admin-token"))
                        .cookie(new HttpCookie("XSRF-ADMIN-TOKEN", "admin-csrf"))
                        .header("X-XSRF-TOKEN", "admin-csrf")
                        .build());
        AtomicReference<String> downstreamAuthorization = new AtomicReference<>();

        filter.filter(exchange, filteredExchange -> {
            downstreamAuthorization.set(filteredExchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION));
            return Mono.empty();
        }).block();

        assertEquals("Bearer admin-token", downstreamAuthorization.get());
    }
}
