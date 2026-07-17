package com.rainbowforest.recommendationservice.websocket;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class ChatHandshakeInterceptorTest {

    private final HandshakeInterceptor interceptor = new ChatHandshakeInterceptor();

    @Test
    void beforeHandshakeMapsAdminToStableChatAlias() throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", "42");
        headers.set("X-User-Roles", "ROLE_ADMIN");
        Map<String, Object> attributes = new HashMap<>();

        boolean accepted = interceptor.beforeHandshake(
                request(headers, "/ws/support-chat"),
                null,
                mock(WebSocketHandler.class),
                attributes
        );

        assertThat(accepted).isTrue();
        assertThat(attributes)
                .containsEntry("authenticatedUserId", "42")
                .containsEntry("userId", "admin")
                .containsEntry("isAdmin", true);
    }

    @Test
    void beforeHandshakeAcceptsValidGuestIdFromQueryString() throws Exception {
        Map<String, Object> attributes = new HashMap<>();

        boolean accepted = interceptor.beforeHandshake(
                request(new HttpHeaders(), "/ws/support-chat?guestId=guest_12345678"),
                null,
                mock(WebSocketHandler.class),
                attributes
        );

        assertThat(accepted).isTrue();
        assertThat(attributes)
                .containsEntry("authenticatedUserId", "guest_12345678")
                .containsEntry("userId", "guest_12345678")
                .containsEntry("isAdmin", false);
    }

    @Test
    void beforeHandshakeRejectsInvalidGuestId() throws Exception {
        Map<String, Object> attributes = new HashMap<>();

        boolean accepted = interceptor.beforeHandshake(
                request(new HttpHeaders(), "/ws/support-chat?guestId=admin"),
                null,
                mock(WebSocketHandler.class),
                attributes
        );

        assertThat(accepted).isFalse();
        assertThat(attributes).isEmpty();
    }

    private ServletServerHttpRequest request(HttpHeaders headers, String pathWithQuery) {
        MockHttpServletRequest servletRequest = new MockHttpServletRequest("GET", pathWithQuery);
        headers.forEach((name, values) -> values.forEach(value -> servletRequest.addHeader(name, value)));
        return new ServletServerHttpRequest(servletRequest);
    }
}
