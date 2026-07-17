package com.rainbowforest.recommendationservice.websocket;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Component
public class ChatHandshakeInterceptor implements HandshakeInterceptor {

    private static final String GUEST_PREFIX = "guest_";

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        String userId = firstHeader(request, "X-User-Id");
        String roles = firstHeader(request, "X-User-Roles");
        String guestId = firstHeader(request, "X-Guest-Id");

        if ((guestId == null || guestId.isBlank()) && request instanceof ServletServerHttpRequest servletRequest) {
            guestId = servletRequest.getServletRequest().getParameter("guestId");
        }
        if ((guestId == null || guestId.isBlank()) && request.getURI().getQuery() != null) {
            guestId = UriComponentsBuilder.fromUri(request.getURI())
                    .build()
                    .getQueryParams()
                    .getFirst("guestId");
        }

        String authenticatedId = userId != null && !userId.isBlank() ? userId.trim() : normalizeGuestId(guestId);
        if (authenticatedId == null) {
            return false;
        }

        attributes.put("authenticatedUserId", authenticatedId);
        attributes.put("userId", roles != null && roles.contains("ROLE_ADMIN") ? "admin" : authenticatedId);
        attributes.put("roles", roles == null ? "" : roles);
        attributes.put("isAdmin", roles != null && roles.contains("ROLE_ADMIN"));
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // No-op.
    }

    private String firstHeader(ServerHttpRequest request, String name) {
        List<String> values = request.getHeaders().get(name);
        if (values == null || values.isEmpty()) {
            return null;
        }
        return values.get(0);
    }

    private String normalizeGuestId(String guestId) {
        if (guestId == null || guestId.isBlank()) {
            return null;
        }
        String trimmed = guestId.trim();
        if (!trimmed.startsWith(GUEST_PREFIX) || trimmed.length() > 80) {
            return null;
        }
        return trimmed.matches("^guest_[A-Za-z0-9_-]{8,72}$") ? trimmed : null;
    }
}
