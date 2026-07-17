package com.rainbowforest.apigateway.filter;

import com.rainbowforest.apigateway.config.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    private JwtUtils jwtUtils;
    private ReactiveRedisTemplate<String, String> redisTemplate;
    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        jwtUtils = mock(JwtUtils.class);
        redisTemplate = mock(ReactiveRedisTemplate.class);
        filter = new JwtAuthenticationFilter(jwtUtils, redisTemplate);
    }

    @Test
    void filterPreservesGuestHeaderForPublicSupportChatRequests() {
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/support-chat/history/guest_123")
                        .header("X-User-Id", "admin")
                        .header("X-User-Roles", "ROLE_ADMIN")
                        .header("X-Guest-Id", "guest_123")
        );

        WebFilterChain chain = chainedExchange -> {
            assertThat(chainedExchange.getRequest().getHeaders().getFirst("X-User-Id")).isNull();
            assertThat(chainedExchange.getRequest().getHeaders().getFirst("X-User-Roles")).isNull();
            assertThat(chainedExchange.getRequest().getHeaders().getFirst("X-Guest-Id")).isEqualTo("guest_123");
            return Mono.empty();
        };

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
    }

    @Test
    void filterOverwritesSpoofedIdentityHeadersWhenTokenIsValid() {
        String token = "valid-token";
        when(redisTemplate.hasKey("blacklist:" + token)).thenReturn(Mono.just(false));
        when(jwtUtils.validateToken(token)).thenReturn(true);
        when(jwtUtils.getUserId(token)).thenReturn("user_7");
        when(jwtUtils.getRoles(token)).thenReturn("ROLE_USER");

        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/account/profile")
                        .header("Authorization", "Bearer " + token)
                        .header("X-User-Id", "admin")
                        .header("X-User-Roles", "ROLE_ADMIN")
                        .header("X-Guest-Id", "guest_123")
        );

        WebFilterChain chain = chainedExchange -> ReactiveSecurityContextHolder.getContext()
                .doOnNext(context -> {
                    assertThat(context.getAuthentication().getName()).isEqualTo("user_7");
                    assertThat(chainedExchange.getRequest().getHeaders().getFirst("X-User-Id")).isEqualTo("user_7");
                    assertThat(chainedExchange.getRequest().getHeaders().getFirst("X-User-Roles")).isEqualTo("ROLE_USER");
                    assertThat(chainedExchange.getRequest().getHeaders().getFirst("X-Guest-Id")).isNull();
                })
                .then();

        StepVerifier.create(filter.filter(exchange, chain)).verifyComplete();
    }
}
